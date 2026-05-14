export const runtime = "nodejs";

import { ok, fail } from "@/lib/api-response";
import { generateAiContent } from "@/lib/ai/service";
import { assertCsrf } from "@/lib/security/csrf";
import { assertSafeOrigin } from "@/lib/security/request";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { getRequestMetadata } from "@/lib/security/request";
import { RESUME_JSON_PROMPT } from "@/lib/ai/prompts";

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

    const metadata = await getRequestMetadata();
    await assertRateLimit({
      actionType: "resume_import",
      userId: user.id,
      ipAddress: metadata.ipAddress,
      max: 10,
      windowMinutes: 60,
    });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return fail("No file provided", 400);
    }

    if (!file.name.toLowerCase().endsWith(".pdf") || file.type !== "application/pdf") {
      return fail("Invalid file type. Only PDF is supported.", 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    const rawJsonString = await generateAiContent({
      mode: "JSON",
      prompt: RESUME_JSON_PROMPT,
      userId: user.id,
      provider: "gemini", // Use Gemini for native PDF parsing
      file: {
        mimeType: "application/pdf",
        data: base64Data,
      },
      metadata: {
        purpose: "parse_pdf_native",
        fileName: file.name,
        fileSize: file.size,
      },
    });

    let parsedResume;
    try {
      parsedResume = JSON.parse(rawJsonString);
    } catch (e) {
      console.error("[ParsePDF] AI returned invalid JSON:", rawJsonString);
      return fail("AI failed to return valid JSON", 500);
    }

    return ok({ data: parsedResume });
  } catch (error) {
    console.error("[ParsePDF] Error:", error);
    return fail(error, 400);
  }
}
