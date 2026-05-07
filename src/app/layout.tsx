import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import "@/app/globals.css";

const sansFont = localFont({
  src: [
    {
      path: "../../public/fonts/Inter-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/Inter-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/Inter-ExtraBold.ttf",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-sans",
  display: "swap",
});

const displayFont = localFont({
  src: [
    {
      path: "../../public/fonts/Inter-ExtraBold.ttf",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VigilSiddhiAI Resume Builder",
  description: "Production-grade AI resume builder with secure downloads, AI tailoring, and payment-gated exports.",
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sansFont.variable} ${displayFont.variable} bg-background text-foreground`}>
        {children}
      </body>
    </html>
  );
}
