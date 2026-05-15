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
import { getTemplateRenderConfig } from "@/lib/resume/template-renderer";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

function toDocxHex(color: string | undefined, fallback = "2563EB") {
  if (!color) return fallback;
  const normalized = color.trim().replace("#", "").toUpperCase();
  return /^[0-9A-F]{6}$/.test(normalized) ? normalized : fallback;
}

function tintHex(color: string, amount = 0.92) {
  const hex = toDocxHex(color);
  const channel = (offset: number) => Number.parseInt(hex.slice(offset, offset + 2), 16);
  const mix = (value: number) => Math.round(value + (255 - value) * amount).toString(16).padStart(2, "0");
  return `${mix(channel(0))}${mix(channel(2))}${mix(channel(4))}`.toUpperCase();
}

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
    const accent = toDocxHex(parsedResume.style?.accent || template.config_json.accent || "#2563eb");
    const layout = (template.config_json.layout || "standard") as string;
    const renderConfig = getTemplateRenderConfig(layout, template.config_json, `#${accent}`);
    const isSplit = renderConfig.hasSidebar || template.config_json.columns === "split";
    const sidebarFill = layout === "sidebar-dark" ? toDocxHex(renderConfig.sidebarBg, accent) : tintHex(accent);

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

    const renderSkills = (isWhite = false) => {
      const color = isWhite ? "FFFFFF" : "333333";
      if (renderConfig.skillStyle === "plain-list") {
        return [new Paragraph({
          spacing: { before: 100, after: 150 },
          children: [new TextRun({ text: parsedResume.skills.join(" / "), size: 20, color })]
        })];
      }

      return parsedResume.skills.map((skill, index) => new Paragraph({
        spacing: { before: index === 0 ? 100 : 40, after: 40 },
        bullet: ["dot-list", "progress-dot"].includes(renderConfig.skillStyle) ? { level: 0 } : undefined,
        children: [
          new TextRun({
            text: ["pill-tags", "inline-tags", "boxed-grid", "numbered-bar"].includes(renderConfig.skillStyle)
              ? `${skill}${renderConfig.skillStyle === "numbered-bar" ? `  ${Math.max(72, 94 - (index % 5) * 5)}%` : ""}`
              : skill,
            size: 20,
            bold: ["pill-tags", "inline-tags", "boxed-grid", "numbered-bar"].includes(renderConfig.skillStyle),
            color,
          })
        ]
      }));
    };


    let sections = [];

    if (layout === "sidebar-dark" || layout === "sidebar-circles") {
      // 2-column table layout for sidebar templates
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
                    width: { size: 32, type: WidthType.PERCENTAGE },
                    shading: { fill: sidebarFill, type: ShadingType.CLEAR },
                    margins: { top: 700, bottom: 700, left: 400, right: 400 },
                    children: [
                      createHeading("Skills", layout === "sidebar-dark" ? "FFFFFF" : accent),
                      ...renderSkills(layout === "sidebar-dark"),
                      createHeading("Education", layout === "sidebar-dark" ? "FFFFFF" : accent),
                      ...renderEducation(layout === "sidebar-dark")
                    ]
                  }),
                  new TableCell({
                    width: { size: 68, type: WidthType.PERCENTAGE },
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
    } else if (layout === "sleek-dark") {
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
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    shading: { fill: accent, type: ShadingType.CLEAR },
                    margins: { top: 1000, bottom: 1000, left: 700, right: 700 },
                    children: [
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: fullName, bold: true, color: "FFFFFF", size: 48 })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: (parsedResume.personal.headline || "").toUpperCase(), bold: true, size: 22, color: "E2E8F0" })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 }, children: [new TextRun({ text: [parsedResume.personal.location, parsedResume.personal.phone, parsedResume.personal.email].filter(Boolean).join("  •  "), size: 18, color: "CBD5E1" })] }),
                    ]
                  })
                ]
              })
            ]
          }),
          new Paragraph({ spacing: { before: 400 } }),
          ...[
            createHeading("Summary", accent),
            new Paragraph({ spacing: { after: 200 }, indent: { left: 700, right: 700 }, children: [new TextRun({ text: parsedResume.summary || "", size: 20 })] }),
            createHeading("Experience", accent),
            ...renderExperience(),
            createHeading("Skills", accent),
            ...renderSkills(),
            createHeading("Education", accent),
            ...renderEducation()
          ].map(p => { 
            // Add margins to body paragraphs
            if (p instanceof Paragraph) {
              // docx Paragraph object is immutable in some ways but we can wrap it or modify it
            }
            return p;
          })
        ]
      }];
    } else if (layout === "modern-columns") {
      sections = [{
        properties: { page: { margin: { top: 700, right: 700, bottom: 700, left: 700 } } },
        children: [
          new Paragraph({ heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER, children: [new TextRun({ text: fullName, bold: true, color: "000000", size: 48 })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [new TextRun({ text: parsedResume.personal.headline || "", bold: true, size: 22, color: accent })] }),
          
          createHeading("Summary", accent),
          new Paragraph({ spacing: { after: 300 }, children: [new TextRun({ text: parsedResume.summary || "", size: 20 })] }),

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
                    shading: { fill: tintHex(accent), type: ShadingType.CLEAR },
                    margins: { left: 300, right: 200, top: 200, bottom: 200 },
                    children: [
                      createHeading("Skills", accent),
                      ...renderSkills(),
                      createHeading("Education", accent),
                      ...renderEducation(),
                      createHeading("Contact", accent),
                      new Paragraph({ children: [new TextRun({ text: parsedResume.personal.email || "", size: 18 })] }),
                      new Paragraph({ children: [new TextRun({ text: parsedResume.personal.phone || "", size: 18 })] }),
                      new Paragraph({ children: [new TextRun({ text: parsedResume.personal.location || "", size: 18 })] }),
                    ]
                  })
                ]
              })
            ]
          })
        ]
      }];
    } else if (layout === "grid-labels") {
      sections = [{
        properties: { page: { margin: { top: 700, right: 700, bottom: 700, left: 700 } } },
        children: [
          new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text: fullName, bold: true, color: "000000", size: 48 })] }),
          new Paragraph({ spacing: { after: 300 }, children: [new TextRun({ text: parsedResume.personal.headline || "", bold: true, size: 22, color: accent })] }),
          
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "ABOUT", bold: true, color: "CCCCCC", size: 18 })] })] }),
                  new TableCell({ width: { size: 80, type: WidthType.PERCENTAGE }, children: [new Paragraph({ spacing: { after: 300 }, children: [new TextRun({ text: parsedResume.summary || "", size: 20 })] })] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "EXPERIENCE", bold: true, color: "CCCCCC", size: 18 })] })] }),
                  new TableCell({ width: { size: 80, type: WidthType.PERCENTAGE }, children: [...renderExperience()] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "SKILLS", bold: true, color: "CCCCCC", size: 18 })] })] }),
                  new TableCell({ width: { size: 80, type: WidthType.PERCENTAGE }, children: [...renderSkills()] })
                ]
              })
            ]
          })
        ]
      }];
    } else if (layout === "banner-soft") {
      sections = [{
        properties: { page: { margin: { top: 0, right: 700, bottom: 700, left: 700 } } },
        children: [
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    shading: { fill: tintHex(accent), type: ShadingType.CLEAR },
                    margins: { top: 700, bottom: 700, left: 700, right: 700 },
                    children: [
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: fullName, bold: true, color: "000000", size: 48 })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: parsedResume.personal.headline || "", bold: true, size: 22, color: accent })] }),
                    ]
                  })
                ]
              })
            ]
          }),
          new Paragraph({ spacing: { before: 300 } }),
          createHeading("Summary", accent),
          new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: parsedResume.summary || "", size: 20 })] }),
          createHeading("Experience", accent),
          ...renderExperience(),
          createHeading("Skills", accent),
          ...renderSkills(),
          createHeading("Education", accent),
          ...renderEducation()
        ]
      }];
    } else {
      // Standard or Generic Layout
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
