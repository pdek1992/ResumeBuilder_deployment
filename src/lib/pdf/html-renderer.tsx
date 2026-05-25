import React from "react";
import { ResumePreview } from "@/components/builder/resume-preview";
import { env } from "@/lib/env";
import type { ResumeData, TemplateRecord } from "@/lib/types";

async function getCompiledCssLinks(assetBaseUrl = env.appUrl) {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const cssDir = path.join(process.cwd(), ".next", "static", "css");

  try {
    const files = await fs.readdir(cssDir);
    const appUrl = assetBaseUrl.replace(/\/$/, "");

    return files
      .filter((file) => file.endsWith(".css"))
      .map((file) => `<link rel="stylesheet" href="${appUrl}/_next/static/css/${file}">`)
      .join("\n");
  } catch {
    return "";
  }
}

function getPdfCriticalCss(assetBaseUrl = env.appUrl) {
  const appUrl = assetBaseUrl.replace(/\/$/, "");

  return `
    @font-face {
      font-family: "Inter";
      src: url("${appUrl}/fonts/Inter-Regular.ttf") format("truetype");
      font-weight: 400;
      font-style: normal;
      font-display: block;
    }
    @font-face {
      font-family: "Inter";
      src: url("${appUrl}/fonts/Inter-Bold.ttf") format("truetype");
      font-weight: 700;
      font-style: normal;
      font-display: block;
    }
    @font-face {
      font-family: "Inter";
      src: url("${appUrl}/fonts/Inter-ExtraBold.ttf") format("truetype");
      font-weight: 800 900;
      font-style: normal;
      font-display: block;
    }

    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      font-family: "Inter", Arial, sans-serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    @page {
      size: A4;
      margin: 0;
    }

    body {
      width: 210mm;
      min-height: 297mm;
      overflow: hidden;
    }

    [data-pdf-page="true"] {
      width: 210mm;
      min-height: 297mm;
      background: #ffffff;
      overflow: hidden;
      position: relative;
    }

    .break-inside-avoid,
    [data-pdf-avoid-break="true"] {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    img {
      max-width: 100%;
    }

    .mx-auto.max-w-\\[640px\\] {
      max-width: none !important;
      width: 100% !important;
    }
  `;
}

export async function generatePdfHtml(resume: ResumeData, template: TemplateRecord, assetBaseUrl = env.appUrl) {
  const { renderToStaticMarkup } = await import("react-dom/server");
  
  const componentHtml = renderToStaticMarkup(
    <ResumePreview resume={resume} template={template} isPrintMode={true} />
  );
  const cssLinks = await getCompiledCssLinks(assetBaseUrl);
  const appUrl = assetBaseUrl.replace(/\/$/, "");

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=794, initial-scale=1">
        <base href="${appUrl}/">
        <link rel="preload" href="${appUrl}/fonts/Inter-Regular.ttf" as="font" type="font/ttf" crossorigin>
        <link rel="preload" href="${appUrl}/fonts/Inter-Bold.ttf" as="font" type="font/ttf" crossorigin>
        <link rel="preload" href="${appUrl}/fonts/Inter-ExtraBold.ttf" as="font" type="font/ttf" crossorigin>
        ${cssLinks}
        <style>
          ${getPdfCriticalCss(assetBaseUrl)}
        </style>
      </head>
      <body>
        ${componentHtml}
      </body>
    </html>
  `;
}
