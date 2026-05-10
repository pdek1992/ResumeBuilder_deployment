import { cookies, headers } from "next/headers";
import { generateRandomToken } from "./tokens";

const CSRF_COOKIE_NAME = "vrb_csrf";

export function generateCsrfCookieValue() {
  return generateRandomToken();
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
    console.error("CSRF Validation Failed:", {
      hasHeader: !!headerValue,
      hasCookie: !!cookieValue,
      match: headerValue === cookieValue,
    });
    throw new Error("Invalid CSRF token");
  }
}
