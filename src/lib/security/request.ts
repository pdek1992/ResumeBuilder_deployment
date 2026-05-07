import { headers } from "next/headers";

export async function getRequestMetadata() {
  const headerStore = await headers();

  return {
    ipAddress: headerStore.get("x-forwarded-for") ?? headerStore.get("x-real-ip") ?? "unknown",
    userAgent: headerStore.get("user-agent") ?? "unknown",
    origin: headerStore.get("origin") ?? "",
    referer: headerStore.get("referer") ?? "",
  };
}

export async function assertSafeOrigin() {
  const { origin, referer } = await getRequestMetadata();

  if (!origin && !referer) {
    return;
  }

  const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (origin && !origin.startsWith(expectedOrigin)) {
    throw new Error("Blocked cross-site request");
  }

  if (referer && !referer.startsWith(expectedOrigin)) {
    throw new Error("Blocked cross-site referer");
  }
}
