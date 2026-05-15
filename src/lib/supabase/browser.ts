"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

let browserClient: any;

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(env.supabaseUrl, env.supabaseAnonKey, {
      cookieOptions: {
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      },
    });
  }

  return browserClient;
}
