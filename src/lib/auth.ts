import { redirect } from "next/navigation";

import type { UserProfile } from "@/lib/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error) {
    console.error("[AUTH DEBUG] supabase.auth.getUser() returned error:", error.message);
  }

  return user;
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const user = await getCurrentUser();

  if (!user) {
    console.log("[AUTH DEBUG] getCurrentUser returned null. User is not authenticated.");
    return null;
  }

  console.log(`[AUTH DEBUG] Authenticated as user ${user.id}, querying users table...`);

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error(`[AUTH DEBUG] Error querying users table for ${user.id}:`, error);
  } else if (!data) {
    console.log(`[AUTH DEBUG] No record found in users table for ${user.id}`);
  }

  return (data as UserProfile | null) ?? null;
}

export async function requireUserProfile() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    console.log("[AUTH DEBUG] requireUserProfile redirecting to /sign-in because profile is null");
    redirect("/sign-in");
  }

  return profile;
}
