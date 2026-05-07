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
  const headerStore = await headers();
  const host = headerStore.get("host") ?? "";

  // In development, we are more lenient with localhost
  const isDev = process.env.NODE_ENV === "development";
  
  if (!origin && !referer) {
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  
  // Check if it's a same-site request by comparing with the current host
  const isSameHost = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.host === host;
    } catch {
      return false;
    }
  };

  if (origin && !isSameHost(origin) && (!isDev || !origin.includes("localhost"))) {
    if (appUrl && !origin.startsWith(appUrl)) {
      console.error(`Blocked Origin: ${origin}, Expected: ${appUrl} or ${host}`);
      throw new Error("Blocked cross-site request");
    }
  }

  if (referer && !isSameHost(referer) && (!isDev || !referer.includes("localhost"))) {
    if (appUrl && !referer.startsWith(appUrl)) {
      console.error(`Blocked Referer: ${referer}, Expected: ${appUrl} or ${host}`);
      throw new Error("Blocked cross-site referer");
    }
  }
}
