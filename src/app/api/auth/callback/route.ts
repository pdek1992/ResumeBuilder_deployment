import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureAppUserProfile } from "@/lib/auth/profile-sync";

export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next") ?? "/dashboard";
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL(next, request.url));
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !session?.user) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  try {
    const admin = getSupabaseAdminClient();
    const metadata = session.user.user_metadata ?? {};

    const { error: upsertError } = await admin.from("users").upsert({
      id: session.user.id,
      email: session.user.email ?? "",
      mobile: metadata.mobile ?? null,
      auth_provider: metadata.auth_provider ?? "google",
      full_name_locked: Boolean(metadata.first_name && metadata.last_name),
      first_name: metadata.first_name ?? session.user.user_metadata?.full_name?.split(" ")[0] ?? "",
      last_name: metadata.last_name ?? session.user.user_metadata?.full_name?.split(" ").slice(1).join(" ") ?? "",
      consent_given: Boolean(metadata.consent_given),
      consent_timestamp: metadata.consent_timestamp ?? null,
      last_login: new Date().toISOString(),
    });

    if (upsertError) {
      console.error("Failed to upsert user profile on login:", upsertError);
    }

    await ensureAppUserProfile({
      userId: session.user.id,
      email: session.user.email,
      mobile: metadata.mobile,
      authProvider: metadata.auth_provider ?? session.user.app_metadata?.provider,
      firstName: metadata.first_name,
      lastName: metadata.last_name,
      fullName: session.user.user_metadata?.full_name,
      consentGiven: Boolean(metadata.consent_given),
      consentTimestamp: metadata.consent_timestamp,
    });
  } catch (err) {
    console.error("Critical error during user profile setup (check SUPABASE_SERVICE_ROLE_KEY):", err);
  }

  return NextResponse.redirect(new URL(next, request.url));
}
