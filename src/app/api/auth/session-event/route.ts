import { ok, fail } from "@/lib/api-response";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { assertCsrf } from "@/lib/security/csrf";
import { assertSafeOrigin } from "@/lib/security/request";
import { logUserAction } from "@/lib/logging";
import { sendTelegramAlert } from "@/lib/telegram";

export async function POST(request: Request) {
  try {
    await assertSafeOrigin();
    await assertCsrf();

    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return fail("Authentication required", 401);
    }

    const body = (await request.json()) as {
      event: "signup" | "login";
      profile?: {
        first_name?: string;
        last_name?: string;
        mobile?: string;
        consent_given?: boolean;
        consent_timestamp?: string;
        auth_provider?: "password" | "google";
      };
    };

    const profile = body.profile ?? {};
    const admin = getSupabaseAdminClient();

    // Check if user exists to avoid triggering the prevent_locked_name_change error on empty names
    const { data: existingUser } = await admin.from("users").select("id").eq("id", user.id).maybeSingle();

    if (existingUser) {
      // Just update login time and mobile/auth_provider if missing
      const { error: updateError } = await admin.from("users").update({
        last_login: new Date().toISOString(),
        ...(profile.mobile && { mobile: profile.mobile }),
        ...(profile.auth_provider && { auth_provider: profile.auth_provider }),
      }).eq("id", user.id);

      if (updateError) {
        console.error("[Session Event] Failed to update user profile:", updateError);
        throw new Error("Failed to update user profile in database");
      }
    } else {
      // Insert new user
      const { error: insertError } = await admin.from("users").insert({
        id: user.id,
        email: user.email ?? "",
        mobile: profile.mobile ?? user.user_metadata?.mobile ?? null,
        auth_provider: profile.auth_provider ?? user.user_metadata?.auth_provider ?? "password",
        full_name_locked: Boolean(profile.first_name && profile.last_name),
        first_name: profile.first_name ?? user.user_metadata?.first_name ?? "",
        last_name: profile.last_name ?? user.user_metadata?.last_name ?? "",
        consent_given: Boolean(profile.consent_given ?? false),
        consent_timestamp: profile.consent_timestamp ?? null,
        last_login: new Date().toISOString(),
      });

      if (insertError) {
        console.error("[Session Event] Failed to insert user profile:", insertError);
        throw new Error("Failed to create user profile in database");
      }
    }

    await logUserAction({
      userId: user.id,
      actionType: body.event,
      metadata: {
        provider: profile.auth_provider ?? user.user_metadata?.auth_provider ?? "password",
      },
    });

    await sendTelegramAlert(`🔐 *User ${body.event === "signup" ? "Registered" : "Logged In"}*\nUser: \`${user.id}\`\nEmail: \`${user.email}\`\nMobile: \`${profile.mobile ?? "Not provided"}\``);

    return ok({ success: true });
  } catch (error) {
    return fail(error, 400);
  }
}
