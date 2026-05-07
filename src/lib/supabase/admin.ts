import { createClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";

let supabaseAdmin: any;

export function getSupabaseAdminClient() {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabaseAdmin;
}
