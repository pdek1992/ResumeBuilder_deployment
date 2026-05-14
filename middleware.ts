import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

function generateRandomToken() {
  return crypto.randomUUID().replace(/-/g, "");
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const PROTECTED_PAGE_PREFIXES = ["/dashboard", "/settings", "/builder"];

function isProtectedPage(pathname: string) {
  return PROTECTED_PAGE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function redirectToSignIn(request: NextRequest) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/sign-in";
  redirectUrl.search = "";
  redirectUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return redirectUrl;
}

function applySecurityHeaders(response: NextResponse) {
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
}

export async function middleware(request: NextRequest) {
  try {
    // 1. Initial response
    let response = NextResponse.next({
      request,
    });
    let isAuthenticated = false;

    // 2. Handle Supabase Session
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          },
        },
      });

      const {
        data: { user },
      } = await supabase.auth.getUser();

      isAuthenticated = Boolean(user);
    }

    if (!isAuthenticated && isProtectedPage(request.nextUrl.pathname)) {
      response = NextResponse.redirect(redirectToSignIn(request));
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
    applySecurityHeaders(response);

    return response;
  } catch (error) {
    console.error("Middleware Critical Error:", error);
    const response = NextResponse.next();
    applySecurityHeaders(response);
    return response;
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ttf)$).*)"],
};
