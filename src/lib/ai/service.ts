import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

import { env, assertServerEnv } from "@/lib/env";
import { logUserAction } from "@/lib/logging";
import { sanitizeAiOutput, validateAiOutput } from "@/lib/ai/sanitizer";
import type { AiOutputMode } from "@/lib/types";

type GenerateAiContentInput = {
  mode: AiOutputMode;
  prompt: string;
  userId: string;
  systemPrompt?: string;
  provider?: "gemini" | "openai";
  metadata?: Record<string, unknown>;
};

const providerCursor = {
  gemini: 0,
  openai: 0,
};

function buildSystemPrompt(mode: AiOutputMode) {
  return [
    "Return ONLY requested output.",
    "Do not add explanations.",
    "Do not add suggestions.",
    "Do not ask follow-up questions.",
    "Do not include introductory or closing text.",
    "Do not behave like a chatbot.",
    "Output must be directly usable.",
    `Output mode: ${mode}.`,
  ].join(" ");
}

function rotate<T>(items: T[], startIndex: number) {
  return items.map((_, index) => items[(startIndex + index) % items.length]);
}

async function generateWithGemini(key: string, prompt: string, mode: AiOutputMode) {
  const client = new GoogleGenerativeAI(key);
  const model = client.getGenerativeModel({
    model: "gemini-1.5-pro",
    systemInstruction: buildSystemPrompt(mode),
  });

  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function generateWithOpenAi(key: string, prompt: string, mode: AiOutputMode) {
  const client = new OpenAI({ apiKey: key });
  const response = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content: buildSystemPrompt(mode),
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  return response.choices[0]?.message?.content ?? "";
}

function isRetryableError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return ["quota", "rate", "429", "timeout", "throttle", "invalid"].some((token) => message.includes(token));
}

export async function generateAiContent({ mode, prompt, userId, systemPrompt, provider: providerOverride, metadata }: GenerateAiContentInput) {
  assertServerEnv(["jwtSecret"]);

  const { getSupabaseAdminClient } = await import("@/lib/supabase/admin");
  const { data: userProfile } = await getSupabaseAdminClient()
    .from("users")
    .select("ai_config")
    .eq("id", userId)
    .single();

  const aiConfig = userProfile?.ai_config ?? {};

  const geminiKeys = aiConfig.geminiApiKey ? [aiConfig.geminiApiKey] : env.geminiApiKeys;
  const openAiKeys = aiConfig.openAiApiKey ? [aiConfig.openAiApiKey] : env.openAiApiKeys;

  const failures: string[] = [];
  let providers = [
    { name: "gemini" as const, keys: geminiKeys },
    { name: "openai" as const, keys: openAiKeys },
  ];

  if (providerOverride) {
    providers = providers.filter(p => p.name === providerOverride);
  }

  const finalSystemPrompt = systemPrompt || buildSystemPrompt(mode);

  for (const provider of providers) {
    if (provider.keys.length === 0) {
      continue;
    }

    const orderedKeys = rotate(provider.keys, providerCursor[provider.name]);

    for (const key of orderedKeys) {
      try {
        let raw = "";
        if (provider.name === "gemini") {
          const client = new GoogleGenerativeAI(key);
          const model = client.getGenerativeModel({
            model: "gemini-1.5-pro",
            systemInstruction: finalSystemPrompt,
          });
          const result = await model.generateContent(prompt);
          raw = result.response.text();
        } else {
          const client = new OpenAI({ apiKey: key });
          const response = await client.chat.completions.create({
            model: "gpt-4.1-mini",
            temperature: 0.4,
            messages: [
              { role: "system", content: finalSystemPrompt },
              { role: "user", content: prompt },
            ],
          });
          raw = response.choices[0]?.message?.content ?? "";
        }
        const sanitized = sanitizeAiOutput(raw, mode);
        const validated = validateAiOutput(mode, sanitized);

        providerCursor[provider.name] = (providerCursor[provider.name] + 1) % provider.keys.length;

        await logUserAction({
          userId,
          actionType: "ai_generation",
          metadata: {
            provider: provider.name,
            mode,
            ...metadata,
          },
        });

        return validated;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown AI error";
        failures.push(`${provider.name}: ${message}`);

        if (!isRetryableError(error)) {
          break;
        }
      }
    }
  }

  await logUserAction({
    userId,
    actionType: "suspicious_activity",
    metadata: {
      reason: "ai_generation_failed",
      failures,
      mode,
    },
  });

  throw new Error("AI generation failed after retry and provider fallback");
}
