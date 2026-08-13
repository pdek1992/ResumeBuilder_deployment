import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRequestMetadata } from "@/lib/security/request";
import type { AccessLogPayload } from "@/lib/types";

export async function logUserAction({ userId, email, actionType, metadata }: AccessLogPayload) {
  const supabase = getSupabaseAdminClient();
  const requestMetadata = await getRequestMetadata();

  await supabase.from("user_access_logs").insert({
    user_id: userId,
    action_type: actionType,
    ip_address: requestMetadata.ipAddress,
    user_agent: requestMetadata.userAgent,
    metadata_json: metadata ?? {},
  });

  await supabase.from("user_last_activity").upsert({
    user_id: userId,
    last_accessed_at: new Date().toISOString(),
  });

}
