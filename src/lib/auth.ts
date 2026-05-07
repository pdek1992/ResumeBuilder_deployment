import { redirect } from "next/navigation";

import type { UserProfile } from "@/lib/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function getCurrentSession() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const session = await getCurrentSession();

  if (!session?.user) {
    return null;
  }

  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", session.user.id)
    .maybeSingle();

  return (data as UserProfile | null) ?? null;
}

export async function requireUserProfile() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/sign-in");
  }

  return profile;
}
