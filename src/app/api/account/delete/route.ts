export const runtime = "nodejs";

import { createClient } from "@supabase/supabase-js";

import { ok, fail } from "@/lib/api-response";
import { env } from "@/lib/env";
import { logUserAction } from "@/lib/logging";
import { assertCsrf } from "@/lib/security/csrf";
import { assertSafeOrigin } from "@/lib/security/request";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

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
      password: string;
      confirmationText: string;
    };

    if (body.confirmationText !== "DELETE") {
      return fail("Confirmation text must be DELETE", 400);
    }

    const profileResponse = await supabase.from("users").select("*").eq("id", user.id).single();
    const profile = profileResponse.data;

    if (!profile) {
      return fail("Profile not found", 404);
    }

    if (profile.auth_provider === "password") {
      if (!body.password) {
        return fail("Password is required", 400);
      }

      const verifier = createClient(env.supabaseUrl, env.supabaseAnonKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
      const { error } = await verifier.auth.signInWithPassword({
        email: profile.email,
        password: body.password,
      });

      if (error) {
        return fail("Password validation failed", 401);
      }
    }

    const admin = getSupabaseAdminClient();
    const { data: resumes } = await admin.from("resumes").select("id").eq("user_id", user.id);

    if (resumes && resumes.length > 0) {
      const resumeIds = (resumes as Array<{ id: string }>).map((item) => item.id);
      await admin.from("resume_versions").delete().in("resume_id", resumeIds);
      await admin.from("cover_letters").delete().in("resume_id", resumeIds);
      await admin.from("mock_interviews").delete().in("resume_id", resumeIds);
      await admin.from("resumes").delete().in("id", resumeIds);
    }

    await admin.from("support_requests").delete().eq("user_id", user.id);
    await admin.from("user_last_activity").delete().eq("user_id", user.id);
    await admin.from("users").update({
      email: `deleted-${user.id}@redacted.local`,
      mobile: null,
      first_name: "Deleted",
      last_name: "User",
      deleted_at: new Date().toISOString(),
    }).eq("id", user.id);

    await admin.auth.admin.deleteUser(user.id);

    await logUserAction({
      userId: user.id,
      actionType: "account_deletion",
    });

    return ok({ success: true });
  } catch (error) {
    return fail(error, 400);
  }
}
