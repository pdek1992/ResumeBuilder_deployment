export const runtime = "nodejs";

import { z } from "zod";

import { ok, fail } from "@/lib/api-response";
import { generateAiContent } from "@/lib/ai/service";
import { assertCsrf } from "@/lib/security/csrf";
import { assertSafeOrigin } from "@/lib/security/request";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createResumeDraft } from "@/lib/resume/repository";
import { createDefaultResumeData, resumeSectionAliases } from "@/lib/resume/defaults";
import { extractResumeTextFromFile } from "@/lib/resume/import";
import { logUserAction } from "@/lib/logging";
import { sendTelegramAlert } from "@/lib/telegram";
import { RESUME_JSON_PROMPT } from "@/lib/ai/prompts";

const importSchema = z.object({
  personal: z.object({
    firstName: z.string().default(""),
    lastName: z.string().default(""),
    email: z.string().default(""),
    phone: z.string().default(""),
    location: z.string().default(""),
    linkedIn: z.string().default(""),
    github: z.string().default(""),
    portfolio: z.string().default(""),
    totalExperience: z.string().default(""),
    headline: z.string().default(""),
    profilePhotoUrl: z.string().default(""),
  }),
  summary: z.string().default(""),
  experience: z.array(z.any()).default([]),
  education: z.array(z.any()).default([]),
  skills: z.array(z.string()).default([]),
  projects: z.array(z.any()).default([]),
  certifications: z.array(z.any()).default([]),
  more: z.array(z.any()).default([]),
  style: z
    .object({
      accent: z.string().default("#0f6c7c"),
      typography: z.enum(["modern-sans", "editorial-serif", "technical-mono"]).default("modern-sans"),
    })
    .default({
      accent: "#0f6c7c",
      typography: "modern-sans",
    }),
  ats: z
    .object({
      targetRole: z.string().default(""),
      targetCompany: z.string().default(""),
      targetJobDescription: z.string().default(""),
      score: z.number().nullable().default(null),
    })
    .default({
      targetRole: "",
      targetCompany: "",
      targetJobDescription: "",
      score: null,
    }),
});

function getErrorMessage(error: any) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) return String(error.message);
  return "Unexpected error";
}

function failImport(message: string, status = 400, error?: unknown) {
  if (error) {
    console.error(`[RESUME_IMPORT] ${message}:`, error);
  } else {
    console.error(`[RESUME_IMPORT] ${message}`);
  }

  return fail(message, status);
}

function isSupportedImportFile(file: File) {
  const lowerName = file.name.toLowerCase();
  return lowerName.endsWith(".pdf") || lowerName.endsWith(".docx") || lowerName.endsWith(".doc");
}

export async function POST(request: Request) {
  try {
    await assertSafeOrigin();
    await assertCsrf();

    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return fail("Authentication required", 401);
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const text = String(formData.get("text") ?? "").trim();
    
    let aiContent = "";

    if (file instanceof File) {
      if (!isSupportedImportFile(file)) {
        return failImport("Unsupported file type. Please upload a PDF, DOCX, or DOC file.");
      }

      if (file.name.toLowerCase().endsWith(".pdf")) {
        // Native AI parsing for PDF
        const arrayBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString("base64");
        
        try {
          aiContent = await generateAiContent({
            mode: "JSON",
            prompt: RESUME_JSON_PROMPT,
            userId: user.id,
            provider: "gemini",
            file: {
              mimeType: "application/pdf",
              data: base64Data,
            },
            metadata: { purpose: "resume_import_native_pdf" },
          });
        } catch (error) {
          return failImport(`AI PDF import failed: ${getErrorMessage(error)}`, 502, error);
        }
      } else {
        // Use traditional extraction for DOCX/DOC
        try {
          const extractedText = await extractResumeTextFromFile(file);
          const prompt = [
            RESUME_JSON_PROMPT,
            "Raw text from document:",
            extractedText.slice(0, 18000),
          ].join("\n");
          
          aiContent = await generateAiContent({
            mode: "JSON",
            prompt,
            userId: user.id,
            metadata: { purpose: "resume_import_docx" },
          });
        } catch (error) {
          return failImport(`Could not read uploaded file: ${getErrorMessage(error)}`, 400, error);
        }
      }
    } else if (text) {
      // Manual text import
      const prompt = [
        RESUME_JSON_PROMPT,
        "Raw text:",
        text.slice(0, 18000),
      ].join("\n");
      
      try {
        aiContent = await generateAiContent({
          mode: "JSON",
          prompt,
          userId: user.id,
          metadata: { purpose: "resume_import_text" },
        });
      } catch (error) {
        return failImport(`AI text import failed: ${getErrorMessage(error)}`, 502, error);
      }
    }

    if (!aiContent) {
      return fail("No import content found", 400);
    }

    let parsed;
    try {
      parsed = importSchema.parse(JSON.parse(aiContent));
    } catch (error) {
      return failImport(`AI returned invalid resume JSON: ${getErrorMessage(error)}`, 502, {
        error,
        contentPreview: aiContent.slice(0, 1000),
      });
    }

    let resume;
    try {
      resume = await createResumeDraft(user.id, `${parsed.personal.firstName || "Imported"} Resume`, parsed);
    } catch (error) {
      return failImport(`Could not save imported resume: ${getErrorMessage(error)}`, 500, error);
    }

    await logUserAction({
      userId: user.id,
      actionType: "resume_import",
      metadata: {
        resumeId: resume.id,
      },
    });

    await sendTelegramAlert(`📄 *Resume Imported*\nUser: \`${user.id}\`\nTitle: \`${resume.title}\``);

    return ok({ resume });
  } catch (error) {
    return failImport(getErrorMessage(error), 400, error);
  }
}
