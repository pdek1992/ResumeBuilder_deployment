import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRequestMetadata } from "@/lib/security/request";
import { sendTelegramAlert } from "@/lib/telegram";
import type { AccessLogPayload } from "@/lib/types";

export async function logUserAction({ userId, actionType, metadata }: AccessLogPayload) {
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

  await sendTelegramAlert([
    `*Resume Builder Alert*`,
    `Action: \`${actionType}\``,
    `User: \`${userId}\``,
    `Time: \`${new Date().toISOString()}\``,
    `IP: \`${requestMetadata.ipAddress}\``,
    metadata ? `Metadata: \`${JSON.stringify(metadata).slice(0, 500)}\`` : undefined,
  ].filter(Boolean).join("\n"));
}
