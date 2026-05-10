import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

function generateRandomToken() {
  return crypto.randomUUID().replace(/-/g, '');
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function middleware(request: NextRequest) {
  try {
    // 1. Initial response
    let response = NextResponse.next({
      request,
    });

    // 2. Handle Supabase Session
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          },
        },
      });

      await supabase.auth.getUser();
    }

    // 3. Handle CSRF Token
    // We check both the request and the response (in case it was set in a previous middleware step or this one)
    const existingCsrf = request.cookies.get("vrb_csrf")?.value || response.cookies.get("vrb_csrf")?.value;
    
    if (!existingCsrf) {
      response.cookies.set("vrb_csrf", generateRandomToken(), {
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        httpOnly: false, // Required for client-side apiFetch to read it
      });
    }

    // 4. Apply Security Headers to the FINAL response object
    const headers = response.headers;
    headers.set("X-Frame-Options", "DENY");
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    headers.set("Cross-Origin-Opener-Policy", "same-origin");
    headers.set("Cross-Origin-Resource-Policy", "same-site");
    
    headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' https://checkout.razorpay.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://api.openai.com https://generativelanguage.googleapis.com https://api.razorpay.com; frame-src https://checkout.razorpay.com; object-src 'none';"
    );

    return response;
  } catch (error) {
    console.error("Middleware Critical Error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ttf)$).*)"],
};
