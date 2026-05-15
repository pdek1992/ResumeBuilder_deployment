export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { Document, HeadingLevel, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, AlignmentType, convertInchesToTwip } from "docx";

import { fail } from "@/lib/api-response";
import { decompressJson } from "@/lib/compression";
import { verifyDownloadToken } from "@/lib/downloads/tokens";
import { logUserAction } from "@/lib/logging";
import { getActiveResumePass } from "@/lib/payments/access";
import { createDefaultResumeData } from "@/lib/resume/defaults";
import { getResumeForUser, listTemplates } from "@/lib/resume/repository";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) return fail("Missing token", 400);

    const payload = await verifyDownloadToken(token);
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.id !== payload.userId) return fail("Authentication required", 401);

    const pass = await getActiveResumePass(user.id, payload.resumeId);
    if (!pass) return fail("Export access expired", 403);

    const [resume, templates] = await Promise.all([getResumeForUser(user.id, payload.resumeId), listTemplates()]);
    if (!resume) return fail("Resume not found", 404);

    const template = templates.find((item) => item.id === resume.template_id) ?? templates[0];
    const parsedResume = decompressJson(resume.raw_json_compressed, createDefaultResumeData());
    const fullName = `${parsedResume.personal.firstName} ${parsedResume.personal.lastName}`.trim() || "Your Name";
    const accent = (parsedResume.style?.accent || template.config_json.accent || "#2563eb").replace("#", "");
    const layout = template.config_json.layout || "standard";
    const isSplit = template.config_json.columns === "split";
    const isDarkSidebar = layout === "sidebar-dark";

    const createHeading = (text: string, color: string = accent) => new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 300, after: 150 },
      border: { bottom: { color: color, space: 1, size: 12, style: BorderStyle.SINGLE } },
      children: [new TextRun({ text: text.toUpperCase(), bold: true, color: color, size: 24 })],
    });

    const createItemHeading = (title: string, subtitle: string, isWhite = false) => [
      new Paragraph({
        spacing: { before: 100 },
        children: [new TextRun({ text: title, bold: true, size: 22, color: isWhite ? "FFFFFF" : "000000" })],
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun({ text: subtitle, italics: true, color: isWhite ? "EEEEEE" : "666666", size: 18 })]
      })
    ];

    const createBullet = (text: string, isWhite = false) => new Paragraph({
      bullet: { level: 0 },
      children: [new TextRun({ text, size: 20, color: isWhite ? "FFFFFF" : "333333" })]
    });

    const renderExperience = (isWhite = false) => parsedResume.experience.flatMap((item) => [
      ...createItemHeading(item.title, [item.company, item.location].filter(Boolean).join(" | "), isWhite),
      ...item.highlights.filter(Boolean).map(h => createBullet(h, isWhite)),
      new Paragraph({ spacing: { after: 150 } }),
    ]);

    const renderEducation = (isWhite = false) => parsedResume.education.flatMap((item) => [
      ...createItemHeading(item.degree, item.school, isWhite),
      new Paragraph({ spacing: { after: 100 } }),
    ]);

    const renderProjects = (isWhite = false) => parsedResume.projects.flatMap((item) => [
      ...createItemHeading(item.name, item.role, isWhite),
      ...item.highlights.filter(Boolean).map(h => createBullet(h, isWhite)),
      new Paragraph({ spacing: { after: 150 } }),
    ]);

    const renderSkills = (isWhite = false) => [
      new Paragraph({
        spacing: { before: 100, after: 150 },
        children: [new TextRun({ text: parsedResume.skills.join(" • "), size: 20, color: isWhite ? "FFFFFF" : "333333" })]
      })
    ];

    let sections = [];

    if (isDarkSidebar) {
      // 2-column table layout for dark sidebar
      sections = [{
        properties: { page: { margin: { top: 0, right: 0, bottom: 0, left: 0 } } },
        children: [
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    shading: { fill: accent, type: ShadingType.CLEAR, color: "auto" },
                    margins: { top: 700, bottom: 700, left: 400, right: 400 },
                    children: [
                      createHeading("Skills", "FFFFFF"),
                      ...renderSkills(true),
                      createHeading("Education", "FFFFFF"),
                      ...renderEducation(true)
                    ]
                  }),
                  new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    margins: { top: 700, bottom: 700, left: 400, right: 400 },
                    children: [
                      new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text: fullName, bold: true, color: "000000", size: 48 })] }),
                      new Paragraph({ children: [new TextRun({ text: parsedResume.personal.headline || "", bold: true, size: 24, color: accent })] }),
                      new Paragraph({ spacing: { after: 300 }, children: [new TextRun({ text: [parsedResume.personal.location, parsedResume.personal.phone, parsedResume.personal.email].filter(Boolean).join(" | "), size: 18, color: "666666" })] }),
                      createHeading("Summary", accent),
                      new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: parsedResume.summary || "", size: 20 })] }),
                      createHeading("Experience", accent),
                      ...renderExperience(),
                      ...(parsedResume.projects.some(p => p.name) ? [createHeading("Projects", accent), ...renderProjects()] : [])
                    ]
                  })
                ]
              })
            ]
          })
        ]
      }];
    } else {
      // Standard or Split Layout
      sections = [{
        properties: { page: { margin: { top: 700, right: 700, bottom: 700, left: 700 } } },
        children: [
          new Paragraph({ heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER, children: [new TextRun({ text: fullName, bold: true, color: "000000", size: 48 })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: parsedResume.personal.headline || "", bold: true, size: 24, color: accent })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [new TextRun({ text: [parsedResume.personal.location, parsedResume.personal.phone, parsedResume.personal.email].filter(Boolean).join(" | "), size: 18, color: "666666" })] }),
          createHeading("Summary", accent),
          new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: parsedResume.summary || "", size: 20 })] }),
          
          ...(isSplit ? [
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 65, type: WidthType.PERCENTAGE },
                      margins: { right: 300 },
                      children: [
                        createHeading("Experience", accent),
                        ...renderExperience(),
                        ...(parsedResume.projects.some(p => p.name) ? [createHeading("Projects", accent), ...renderProjects()] : [])
                      ]
                    }),
                    new TableCell({
                      width: { size: 35, type: WidthType.PERCENTAGE },
                      margins: { left: 300 },
                      children: [
                        createHeading("Skills", accent),
                        ...renderSkills(),
                        createHeading("Education", accent),
                        ...renderEducation()
                      ]
                    })
                  ]
                })
              ]
            })
          ] : [
            createHeading("Experience", accent),
            ...renderExperience(),
            ...(parsedResume.projects.some(p => p.name) ? [createHeading("Projects", accent), ...renderProjects()] : []),
            createHeading("Skills", accent),
            ...renderSkills(),
            createHeading("Education", accent),
            ...renderEducation()
          ])
        ],
      }];
    }

    const doc = new Document({ sections });
    const buffer = await Packer.toBuffer(doc);

    await logUserAction({ userId: user.id, actionType: "docx_download", metadata: { resumeId: resume.id } });

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
