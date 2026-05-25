import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

import { assertServerEnv, env } from "@/lib/env";

export type PdfRenderJobPayload = {
  jobId: string;
  userId: string;
  resumeId: string;
  nonce: string;
  timestamp: number;
  expiresAt: number;
};

export type SignedPdfRenderJob = PdfRenderJobPayload & {
  signature: string;
};

function getSecret() {
  assertServerEnv(["pdfRendererSecret"]);
  return env.pdfRendererSecret;
}

function canonicalize(payload: PdfRenderJobPayload) {
  return JSON.stringify({
    expiresAt: payload.expiresAt,
    jobId: payload.jobId,
    nonce: payload.nonce,
    resumeId: payload.resumeId,
    timestamp: payload.timestamp,
    userId: payload.userId,
  });
}

export function createPdfRenderJobPayload(input: Pick<PdfRenderJobPayload, "jobId" | "userId" | "resumeId">) {
  const timestamp = Date.now();

  return {
    ...input,
    nonce: randomUUID(),
    timestamp,
    expiresAt: timestamp + 60_000,
  };
}

export function signPdfRenderJob(payload: PdfRenderJobPayload): SignedPdfRenderJob {
  const signature = createHmac("sha256", getSecret()).update(canonicalize(payload)).digest("hex");

  return {
    ...payload,
    signature,
  };
}

export function verifyPdfRenderJob(payload: SignedPdfRenderJob) {
  if (!payload.signature || Date.now() > payload.expiresAt) {
    return false;
  }

  const expected = signPdfRenderJob(payload).signature;
  const provided = Buffer.from(payload.signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  return provided.length === expectedBuffer.length && timingSafeEqual(provided, expectedBuffer);
}
