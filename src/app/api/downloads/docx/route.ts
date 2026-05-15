export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";

import { fail } from "@/lib/api-response";
import { decompressJson } from "@/lib/compression";
import { verifyDownloadToken } from "@/lib/downloads/tokens";
import { logUserAction } from "@/lib/logging";
import { getActiveResumePass } from "@/lib/payments/access";
import { createDefaultResumeData } from "@/lib/resume/defaults";
import { getResumeForUser } from "@/lib/resume/repository";
import { getSupabaseServerClient } from "@/lib/supabase/server";
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

    const pass = await getActiveResumePass(user.id);

    if (!pass) {
      return fail("Export access expired", 403);
    }

    const [resume, templates] = await Promise.all([getResumeForUser(user.id, payload.resumeId), listTemplates()]);

    if (!resume) {
      return fail("Resume not found", 404);
    }

    const template = templates.find((item) => item.id === resume.template_id) ?? templates[0];
    const parsedResume = decompressJson(resume.raw_json_compressed, createDefaultResumeData());
    const fullName = `${parsedResume.personal.firstName} ${parsedResume.personal.lastName}`.trim();
    const accent = (parsedResume.style?.accent || template.config_json.accent || "#2563eb").replace("#", "");

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              heading: HeadingLevel.TITLE,
              children: [new TextRun({ text: fullName, bold: true, color: accent, size: 48 })],
            }),
            new Paragraph({
              children: [new TextRun({ text: parsedResume.personal.headline || "", italics: true, color: "666666" })]
            }),
            new Paragraph({
              children: [new TextRun({ text: [parsedResume.personal.location, parsedResume.personal.phone, parsedResume.personal.email].filter(Boolean).join(" | "), size: 18, color: "999999" })]
            }),
            new Paragraph({ spacing: { before: 400 }, children: [new TextRun({ text: parsedResume.summary || "", size: 20 })] }),
            
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
              children: [new TextRun({ text: "Experience", bold: true, color: accent, allCaps: true })],
            }),
            ...parsedResume.experience.flatMap((item) => [
              new Paragraph({
                children: [new TextRun({ text: item.title, bold: true, size: 24 })],
              }),
              new Paragraph({
                children: [new TextRun({ text: [item.company, item.location].filter(Boolean).join(" | "), italics: true, color: "666666" })]
              }),
              ...item.highlights.filter(Boolean).map((highlight) => new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: highlight, size: 20 })] })),
              new Paragraph({ spacing: { after: 200 } }),
            ]),

            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
              children: [new TextRun({ text: "Skills", bold: true, color: accent, allCaps: true })],
            }),
            new Paragraph({
              children: [new TextRun({ text: parsedResume.skills.join(" • "), size: 20 })]
            }),

            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
              children: [new TextRun({ text: "Education", bold: true, color: accent, allCaps: true })],
            }),
            ...parsedResume.education.flatMap((item) => [
              new Paragraph({
                children: [new TextRun({ text: item.degree, bold: true, size: 22 })],
              }),
              new Paragraph({
                children: [new TextRun({ text: item.school, italics: true, color: "666666" })]
              }),
              new Paragraph({ spacing: { after: 100 } }),
            ]),

            ...(parsedResume.projects.some(p => p.name) ? [
              new Paragraph({
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 },
                children: [new TextRun({ text: "Projects", bold: true, color: accent, allCaps: true })],
              }),
              ...parsedResume.projects.flatMap((item) => [
                new Paragraph({
                  children: [new TextRun({ text: item.name, bold: true, size: 22 })],
                }),
                ...item.highlights.filter(Boolean).map((highlight) => new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: highlight, size: 20 })] })),
                new Paragraph({ spacing: { after: 100 } }),
              ])
            ] : []),

            ...parsedResume.more.flatMap((item) => [
              new Paragraph({
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 },
                children: [new TextRun({ text: item.label, bold: true, color: accent, allCaps: true })],
              }),
              new Paragraph({ children: [new TextRun({ text: item.value, size: 20 })] }),
            ]),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    await logUserAction({
      userId: user.id,
      actionType: "docx_download",
      metadata: {
        resumeId: resume.id,
      },
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "content-type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "content-disposition": `attachment; filename="${slugify(resume.title || "resume")}.docx"`,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return fail(error, 400);
  }
}
