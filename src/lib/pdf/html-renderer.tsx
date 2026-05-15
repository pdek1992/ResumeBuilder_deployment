import React from "react";
import { renderToString } from "react-dom/server";
import { ResumePreview } from "@/components/builder/resume-preview";
import type { ResumeData, TemplateRecord } from "@/lib/types";

export function generatePdfHtml(resume: ResumeData, template: TemplateRecord) {
  const componentHtml = renderToString(
    <ResumePreview resume={resume} template={template} isPrintMode={true} />
  );

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Outfit:wght@100..900&family=Roboto+Mono:ital,wght@0,100..700;1,100..700&display=swap" rel="stylesheet">
        
        <style type="text/tailwindcss">
          @theme {
            --color-background: #ffffff;
            --color-foreground: #0f172a;
            --color-primary: #2563eb;
            --color-primary-foreground: #ffffff;
            --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
            --font-display: "Outfit", ui-sans-serif, system-ui, sans-serif;
            --font-mono: "Roboto Mono", ui-monospace, SFMono-Regular, monospace;
          }
        </style>
        
        <style>
          body {
            margin: 0;
            padding: 0;
            background: white;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Force page breaks cleanly if needed */
          .break-inside-avoid {
            break-inside: avoid;
          }
          
          /* Remove arbitrary container max-widths for print */
          .mx-auto.max-w-\\[760px\\] {
            max-width: none !important;
            width: 100% !important;
          }
        </style>
      </head>
      <body>
        ${componentHtml}
      </body>
    </html>
  `;
}
