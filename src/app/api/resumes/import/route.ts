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
    const extractedText =
      file instanceof File ? await extractResumeTextFromFile(file) : text;

    if (!extractedText) {
      return fail("No import content found", 400);
    }

    const prompt = [
      "Map this raw resume text into the exact JSON structure requested.",
      "Return ONLY valid JSON.",
      "Use these section aliases as equivalent targets:",
      JSON.stringify(resumeSectionAliases),
      "JSON keys required:",
      JSON.stringify(createDefaultResumeData()),
      "Resume text:",
      extractedText.slice(0, 18000),
    ].join("\n");

    const content = await generateAiContent({
      mode: "JSON",
      prompt,
      userId: user.id,
      metadata: {
        purpose: "resume_import",
      },
    });

    const parsed = importSchema.parse(JSON.parse(content));
    const resume = await createResumeDraft(user.id, `${parsed.personal.firstName || "Imported"} Resume`, parsed);

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
    return fail(error, 400);
  }
}
