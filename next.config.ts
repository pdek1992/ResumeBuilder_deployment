import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  images: {
    remotePatterns: [],
  },
  serverExternalPackages: ["@napi-rs/canvas"],
  async headers() {
    const securityHeaders = [
      {
        key: "X-Frame-Options",
        value: "DENY",
      },
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
      // Allow Razorpay checkout popup to communicate back
      {
        key: "Cross-Origin-Opener-Policy",
        value: "same-origin-allow-popups",
      },
      // Removed Cross-Origin-Resource-Policy — it blocks Razorpay's CDN resources
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          // Razorpay checkout.js + its own scripts
          "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://api.razorpay.com",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob: https:",
          "font-src 'self' data: https://checkout.razorpay.com",
          // All Razorpay endpoints the checkout communicates with
          "connect-src 'self' https://*.supabase.co https://api.openai.com https://generativelanguage.googleapis.com https://api.razorpay.com https://*.razorpay.com https://lumberjack.razorpay.com",
          // Razorpay checkout iframe + api frame
          "frame-src https://checkout.razorpay.com https://api.razorpay.com",
          "object-src 'none'",
        ].join("; "),
      },
    ];

    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
