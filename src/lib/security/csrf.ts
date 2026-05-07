import { cookies, headers } from "next/headers";

const CSRF_COOKIE_NAME = "vrb_csrf";

function createRandomToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function generateCsrfCookieValue() {
  return createRandomToken();
}

export async function getOrCreateCsrfToken() {
  const cookieStore = await cookies();
  const existing = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  if (existing) {
    return existing;
  }

  const value = generateCsrfCookieValue();
  cookieStore.set(CSRF_COOKIE_NAME, value, {
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return value;
}

export async function assertCsrf() {
  const headerStore = await headers();
  const cookieStore = await cookies();
  const headerValue = headerStore.get("x-csrf-token");
  const cookieValue = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  if (!headerValue || !cookieValue || headerValue !== cookieValue) {
    throw new Error("Invalid CSRF token");
  }
}
