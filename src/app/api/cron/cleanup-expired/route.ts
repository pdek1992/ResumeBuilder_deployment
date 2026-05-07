export const runtime = "nodejs";

import { ok, fail } from "@/lib/api-response";
import { env } from "@/lib/env";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  if (authHeader !== `Bearer ${env.cronSecret}`) {
    return fail("Unauthorized", 401);
  }

  try {
    const supabase = getSupabaseAdminClient();
    const now = new Date().toISOString();

    await supabase
      .from("payments")
      .update({ status: "expired" })
      .lt("expires_at", now)
      .eq("status", "paid");

    return ok({ success: true, processedAt: now });
  } catch (error) {
    return fail(error, 500);
  }
}
