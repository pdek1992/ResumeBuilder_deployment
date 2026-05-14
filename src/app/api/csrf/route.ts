import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { generateCsrfCookieValue } from "@/lib/security/csrf";

const CSRF_COOKIE_NAME = "vrb_csrf";

export async function GET() {
  const cookieStore = await cookies();
  let token = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  if (!token) {
    token = generateCsrfCookieValue();
  }

  const response = NextResponse.json({ token });

  // Always re-set the cookie on the response so the browser receives it
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    httpOnly: false, // Must be readable by client JS
  });

  return response;
}
