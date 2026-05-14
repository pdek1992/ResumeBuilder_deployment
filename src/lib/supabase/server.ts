import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { env } from "@/lib/env";

export async function getSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookieValues) {
        try {
          cookieValues.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch (e) {
          // This will throw during render, but we can ignore it here as the 
          // actual cookie setting should happen in middleware or route handlers.
        }
      },
    },
  }) as any;
}
