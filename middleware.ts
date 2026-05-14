import { NextResponse, type NextRequest } from "next/server";

function generateRandomToken() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
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

export function middleware(request: NextRequest) {
  try {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-current-path", `${request.nextUrl.pathname}${request.nextUrl.search}`);

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    const existingCsrf = request.cookies.get("vrb_csrf")?.value;
    
    if (!existingCsrf) {
      response.cookies.set("vrb_csrf", generateRandomToken(), {
        sameSite: "lax",
        secure: request.nextUrl.protocol === "https:",
        path: "/",
        httpOnly: false, // Required for client-side apiFetch to read it
      });
    }

    applySecurityHeaders(response);

    return response;
  } catch (error) {
    console.error("Middleware Critical Error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ttf)$).*)"],
};
