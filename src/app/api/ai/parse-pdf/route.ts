export const runtime = "nodejs";

import { ok, fail } from "@/lib/api-response";
import { generateAiContent } from "@/lib/ai/service";
import { assertCsrf } from "@/lib/security/csrf";
import { assertSafeOrigin } from "@/lib/security/request";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { getRequestMetadata } from "@/lib/security/request";
import { RESUME_JSON_PROMPT } from "@/lib/ai/prompts";
import { PDFParse } from "pdf-parse";

// Resolve pdf.worker.mjs issue for Next.js/Vercel
PDFParse.setWorker("https://unpkg.com/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs");

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
    const buffer = Buffer.from(arrayBuffer);

    const parser = new PDFParse({ data: buffer });
    const pdfData = await parser.getText();
    const textContent = pdfData.text;

    if (!textContent || textContent.trim().length === 0) {
      return fail("Could not extract text from the PDF", 400);
    }

    const prompt = `${RESUME_JSON_PROMPT}\n\nRaw Text to Parse:\n${textContent}`;

    const rawJsonString = await generateAiContent({
      mode: "JSON",
      prompt,
      userId: user.id,
      metadata: {
        purpose: "parse_pdf",
        fileName: file.name,
        fileSize: file.size,
      },
    });

    let parsedResume;
    try {
      parsedResume = JSON.parse(rawJsonString);
    } catch (e) {
      return fail("AI failed to return valid JSON", 500);
    }

    return ok({ data: parsedResume });
  } catch (error) {
    return fail(error, 400);
  }
}
