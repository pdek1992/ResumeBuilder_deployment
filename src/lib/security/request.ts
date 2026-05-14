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

  // In development, be lenient with localhost
  const isDev = process.env.NODE_ENV === "development";
  if (isDev) return;

  // No origin/referer means a server-to-server or same-origin fetch — allow it
  if (!origin && !referer) return;

  // Build set of allowed hostnames from NEXT_PUBLIC_APP_URL (strip trailing slash)
  const allowedHosts = new Set<string>();
  allowedHosts.add(host);

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  if (appUrl) {
    try {
      allowedHosts.add(new URL(appUrl).host);
    } catch {
      // ignore malformed URL
    }
  }

  const isAllowed = (url: string) => {
    try {
      return allowedHosts.has(new URL(url).host);
    } catch {
      return false;
    }
  };

  if (origin && !isAllowed(origin)) {
    console.error(`Blocked Origin: ${origin}, Allowed: ${[...allowedHosts].join(", ")}`);
    throw new Error("Blocked cross-site request");
  }

  if (referer && !isAllowed(referer)) {
    console.error(`Blocked Referer: ${referer}, Allowed: ${[...allowedHosts].join(", ")}`);
    throw new Error("Blocked cross-site referer");
  }
}

