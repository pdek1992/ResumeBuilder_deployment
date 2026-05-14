import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type ProfileSyncInput = {
  userId: string;
  email?: string | null;
  mobile?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  authProvider?: string | null;
  consentGiven?: boolean | null;
  consentTimestamp?: string | null;
};

function normalizeAuthProvider(provider?: string | null) {
  return provider === "google" ? "google" : "password";
}

function splitName(input: ProfileSyncInput) {
  const fullName = input.fullName?.trim() ?? "";
  const parts = fullName.split(/\s+/).filter(Boolean);

  return {
    firstName: input.firstName?.trim() || parts[0] || "User",
    lastName: input.lastName?.trim() || parts.slice(1).join(" ") || "",
  };
}

function isMissingTableError(error: { code?: string; message?: string }) {
  return error.code === "PGRST205" || error.message?.toLowerCase().includes("could not find the table");
}

export async function ensureAppUserProfile(input: ProfileSyncInput) {
  const admin = getSupabaseAdminClient();
  let syncInput = { ...input };

  if (!syncInput.email) {
    const { data, error } = await admin.auth.admin.getUserById(syncInput.userId);

    if (!error && data.user) {
      const metadata = data.user.user_metadata ?? {};
      syncInput = {
        ...syncInput,
        email: data.user.email,
        mobile: syncInput.mobile ?? metadata.mobile,
        firstName: syncInput.firstName ?? metadata.first_name,
        lastName: syncInput.lastName ?? metadata.last_name,
        fullName: syncInput.fullName ?? metadata.full_name,
        authProvider: syncInput.authProvider ?? data.user.app_metadata?.provider ?? metadata.auth_provider,
      };
    }
  }

  const email = syncInput.email || `sync_fallback_${syncInput.userId}@resumebuilder.internal`;
  const { firstName, lastName } = splitName(syncInput);

  const { data: existingUser, error: existingError } = await admin
    .from("users")
    .select("id,email,mobile")
    .eq("id", syncInput.userId)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Public users lookup failed: ${existingError.message}`);
  }

  const { error: userError } = existingUser
    ? await admin
        .from("users")
        .update({
          last_login: new Date().toISOString(),
          ...(syncInput.mobile ? { mobile: syncInput.mobile } : {}),
          ...(syncInput.authProvider ? { auth_provider: normalizeAuthProvider(syncInput.authProvider) } : {}),
          ...(typeof syncInput.consentGiven === "boolean"
            ? {
                consent_given: syncInput.consentGiven,
                consent_timestamp: syncInput.consentTimestamp ?? new Date().toISOString(),
              }
            : {}),
        })
        .eq("id", syncInput.userId)
    : await admin.from("users").insert({
        id: syncInput.userId,
        email,
        mobile: syncInput.mobile ?? null,
        auth_provider: normalizeAuthProvider(syncInput.authProvider),
        first_name: firstName,
        last_name: lastName,
        full_name_locked: Boolean(firstName && lastName),
        consent_given: Boolean(syncInput.consentGiven ?? false),
        consent_timestamp: syncInput.consentTimestamp ?? null,
        last_login: new Date().toISOString(),
        is_admin: false,
      });

  if (userError) {
    throw new Error(`Public users sync failed: ${userError.message}`);
  }

  const profileEmail = existingUser?.email ?? email;
  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: syncInput.userId,
      email: profileEmail,
      mobile: syncInput.mobile ?? existingUser?.mobile ?? null,
    },
    { onConflict: "id" },
  );

  if (profileError && !isMissingTableError(profileError)) {
    throw new Error(`Legacy profiles sync failed: ${profileError.message}`);
  }
}
