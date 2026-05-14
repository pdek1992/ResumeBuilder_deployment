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
  provider?: "gemini" | "openai" | "nvidia";
  metadata?: Record<string, unknown>;
  file?: {
    mimeType: string;
    data: string; // base64
  };
};

const providerCursor = {
  gemini: 0,
  openai: 0,
  nvidia: 0,
};

const modelCursor = {
  gemini: 0,
  openai: 0,
  nvidia: 0,
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

function isRetryableError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  // 429, 503, 504, timeouts are retryable with different keys or after a delay
  return ["quota", "rate", "429", "timeout", "throttle", "503", "504", "service unavailable", "overloaded"].some((token) => message.includes(token));
}

function uniqueKeys(keys: Array<string | undefined>) {
  return Array.from(new Set(keys.filter((key): key is string => Boolean(key))));
}

export async function generateAiContent({ mode, prompt, userId, systemPrompt, provider: providerOverride, metadata, file }: GenerateAiContentInput) {
  assertServerEnv(["jwtSecret"]);

  const { getSupabaseAdminClient } = await import("@/lib/supabase/admin");
  const { data: userProfile } = await getSupabaseAdminClient()
    .from("users")
    .select("ai_config")
    .eq("id", userId)
    .single();

  const aiConfig = userProfile?.ai_config ?? {};

  const geminiKeys = uniqueKeys([aiConfig.geminiApiKey, ...env.geminiApiKeys]);
  const openAiKeys = uniqueKeys([aiConfig.openAiApiKey, ...env.openAiApiKeys]);

  const failures: string[] = [];
  let providers = [
    { name: "gemini" as const, keys: geminiKeys, models: env.geminiModels },
    { name: "openai" as const, keys: openAiKeys, models: env.openAiModels },
    { name: "nvidia" as const, keys: env.nvidiaApiKeys, models: env.nvidiaModels, baseUrl: "https://integrate.api.nvidia.com/v1" },
  ];

  // Randomize provider order to prevent hitting the same provider first every time
  if (!providerOverride) {
    providers.sort(() => Math.random() - 0.5);
  } else {
    providers = providers.filter(p => p.name === providerOverride);
  }

  if (providers.every((provider) => provider.keys.length === 0)) {
    throw new Error("No AI provider keys configured. Set GEMINI_API_KEYS or OPENAI_API_KEYS in .env locally and in Vercel environment variables.");
  }

  const finalSystemPrompt = systemPrompt || buildSystemPrompt(mode);

  for (const provider of providers) {
    if (provider.keys.length === 0) {
      continue;
    }

    // Use random starting points for rotation to better distribute load across keys/models
    const keyStartIndex = Math.floor(Math.random() * provider.keys.length);
    const modelStartIndex = Math.floor(Math.random() * provider.models.length);
    
    const orderedKeys = rotate(provider.keys, keyStartIndex);
    const orderedModels = rotate(provider.models, modelStartIndex);

    for (const modelName of orderedModels) {
      for (const key of orderedKeys) {
        const maskedKey = `${key.slice(0, 4)}...${key.slice(-4)}`;
        try {
          console.log(`[AI] Attempting ${provider.name}/${modelName} (Key: ${maskedKey})`);
          
          let raw = "";
          if (provider.name === "gemini") {
            const client = new GoogleGenerativeAI(key);
            const model = client.getGenerativeModel({
              model: modelName,
              systemInstruction: finalSystemPrompt,
            });
            const result = await model.generateContent(
              file
                ? [
                    {
                      inlineData: {
                        mimeType: file.mimeType,
                        data: file.data,
                      },
                    },
                    prompt,
                  ]
                : prompt
            );
            raw = result.response.text();
          } else {
            const client = new OpenAI({ 
              apiKey: key,
              baseURL: (provider as any).baseUrl || undefined 
            });
            const response = await client.chat.completions.create({
              model: modelName,
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

          // Update cursors for non-random tracking
          providerCursor[provider.name] = (keyStartIndex + 1) % provider.keys.length;
          modelCursor[provider.name] = (modelStartIndex + 1) % provider.models.length;

          await logUserAction({
            userId,
            actionType: "ai_generation",
            metadata: {
              provider: provider.name,
              model: modelName,
              mode,
              ...metadata,
            },
          });

          return validated;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown AI error";
          const isRetryable = isRetryableError(error);
          
          failures.push(`${provider.name}/${modelName} [${maskedKey}]: ${message}`);
          console.error(`[AI] ${provider.name}/${modelName} failed:`, message);

          if (!isRetryable) {
            console.warn(`[AI] Non-retryable error for ${modelName}, skipping to next model.`);
            break; // Skip all other keys for this model and go to next model
          }
          // Continue to next key for the same model if it's a quota/rate error
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

  throw new Error(`AI generation failed after retry and provider fallback: ${failures.join(" | ") || "no provider keys attempted"}`);
}
