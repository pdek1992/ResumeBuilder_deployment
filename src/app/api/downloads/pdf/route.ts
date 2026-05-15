export const runtime = "nodejs";
export const maxDuration = 60;

import { NextResponse } from "next/server";

import { fail } from "@/lib/api-response";
import { verifyDownloadToken } from "@/lib/downloads/tokens";
import { getActiveResumePass } from "@/lib/payments/access";
import { generatePdfHtml } from "@/lib/pdf/html-renderer";
import { getBrowser } from "@/lib/pdf/pdf-engine";
import { createDefaultResumeData } from "@/lib/resume/defaults";
import { getResumeForUser, listTemplates } from "@/lib/resume/repository";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { decompressJson } from "@/lib/compression";
import { logUserAction } from "@/lib/logging";
import { slugify } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return fail("Missing token", 400);
    }

    const payload = await verifyDownloadToken(token);
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== payload.userId) {
      return fail("Authentication required", 401);
    }

    const pass = await getActiveResumePass(user.id, payload.resumeId);

    if (!pass) {
      return fail("Export access expired", 403);
    }

    const [resume, templates] = await Promise.all([getResumeForUser(user.id, payload.resumeId), listTemplates()]);

    if (!resume) {
      return fail("Resume not found", 404);
    }

    const template = templates.find((item) => item.id === resume.template_id) ?? templates[0];
    const parsedResume = decompressJson(resume.raw_json_compressed, createDefaultResumeData());
    
    // Generate the PDF using Puppeteer
    const html = await generatePdfHtml(parsedResume, template);
    const browser = await getBrowser();
    
    let pdfBuffer: Buffer;
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" as any });
      
      const buffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      });
      pdfBuffer = Buffer.from(buffer);
    } finally {
      await browser.close();
    }

    await logUserAction({
      userId: user.id,
      actionType: "pdf_download",
      metadata: {
        resumeId: resume.id,
      },
    });

    return new NextResponse(pdfBuffer as any, {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${slugify(resume.title || "resume")}.pdf"`,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return fail(error, 400);
  }
}
