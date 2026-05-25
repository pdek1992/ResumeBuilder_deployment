import { env } from "@/lib/env";
import type { SignedPdfRenderJob } from "@/lib/pdf/signing";

export type PdfRenderResult = {
  status: "success";
  url: string;
};

function getRendererEndpoint(fallbackOrigin?: string) {
  const baseUrl = (env.pdfRendererUrl || fallbackOrigin || env.appUrl).replace(/\/$/, "");

  return `${baseUrl}/api/internal/pdf-render`;
}

export async function requestPdfRender(job: SignedPdfRenderJob, fallbackOrigin?: string): Promise<PdfRenderResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.pdfRendererTimeoutMs);

  try {
    const response = await fetch(getRendererEndpoint(fallbackOrigin), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-renderer": "pdf",
      },
      body: JSON.stringify(job),
      cache: "no-store",
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok || payload?.status !== "success" || !payload?.url) {
      throw new Error(payload?.error || "PDF renderer failed");
    }

    return payload as PdfRenderResult;
  } finally {
    clearTimeout(timer);
  }
}
