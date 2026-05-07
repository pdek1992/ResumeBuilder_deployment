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

    const resume = await getResumeForUser(user.id, payload.resumeId);

    if (!resume) {
      return fail("Resume not found", 404);
    }

    const parsedResume = decompressJson(resume.raw_json_compressed, createDefaultResumeData());
    const fullName = `${parsedResume.personal.firstName} ${parsedResume.personal.lastName}`.trim();

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              heading: HeadingLevel.TITLE,
              children: [new TextRun({ text: fullName, bold: true })],
            }),
            new Paragraph(parsedResume.personal.headline),
            new Paragraph(parsedResume.summary),
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              children: [new TextRun("Experience")],
            }),
            ...parsedResume.experience.flatMap((item) => [
              new Paragraph({
                heading: HeadingLevel.HEADING_2,
                children: [new TextRun({ text: item.title, bold: true })],
              }),
              new Paragraph([item.company, item.location].filter(Boolean).join(" | ")),
              ...item.highlights.filter(Boolean).map((highlight) => new Paragraph({ bullet: { level: 0 }, text: highlight })),
            ]),
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              children: [new TextRun("Skills")],
            }),
            ...parsedResume.skills.map((skill) => new Paragraph({ bullet: { level: 0 }, text: skill })),
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
