import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  images: {
    remotePatterns: [],
  },
  serverExternalPackages: ["pdfjs-dist", "pdf-parse"],
};

export default nextConfig;
