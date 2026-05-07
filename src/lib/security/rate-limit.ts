import { subMinutes } from "date-fns";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type RateLimitInput = {
  actionType: string;
  userId?: string;
  ipAddress?: string;
  max: number;
  windowMinutes: number;
};

export async function assertRateLimit(input: RateLimitInput) {
  const supabase = getSupabaseAdminClient();
  const since = subMinutes(new Date(), input.windowMinutes).toISOString();

  let query = supabase
    .from("user_access_logs")
    .select("id", { count: "exact", head: true })
    .eq("action_type", input.actionType)
    .gte("created_at", since);

  if (input.userId) {
    query = query.eq("user_id", input.userId);
  } else if (input.ipAddress) {
    query = query.eq("ip_address", input.ipAddress);
  }

  const { count } = await query;

  if ((count ?? 0) >= input.max) {
    throw new Error("Rate limit exceeded");
  }
}
