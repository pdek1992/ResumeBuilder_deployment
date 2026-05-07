import { jwtVerify, SignJWT } from "jose";

import { env, assertServerEnv } from "@/lib/env";

type DownloadTokenPayload = {
  userId: string;
  resumeId: string;
  format: "pdf" | "docx";
};

function getSecret() {
  assertServerEnv(["jwtSecret"]);
  return new TextEncoder().encode(env.jwtSecret);
}

export async function createDownloadToken(payload: DownloadTokenPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(getSecret());
}

export async function verifyDownloadToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret());
  return payload as unknown as DownloadTokenPayload;
}
