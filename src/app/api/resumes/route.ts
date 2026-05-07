import { ok, fail } from "@/lib/api-response";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { assertCsrf } from "@/lib/security/csrf";
import { assertSafeOrigin } from "@/lib/security/request";
import { createDefaultResumeData } from "@/lib/resume/defaults";
import { createResumeDraft } from "@/lib/resume/repository";
import { logUserAction } from "@/lib/logging";
import { listUserResumes } from "@/lib/resume/repository";

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return fail("Authentication required", 401);
    }

    return ok({ resumes: await listUserResumes(user.id) });
  } catch (error) {
    return fail(error, 500);
  }
}

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

    const body = (await request.json()) as { mode?: "blank"; title?: string };
    const resume = await createResumeDraft(user.id, body.title ?? "Untitled Resume", createDefaultResumeData());

    await logUserAction({
      userId: user.id,
      actionType: "resume_create",
      metadata: {
        resumeId: resume.id,
        mode: body.mode ?? "blank",
      },
    });

    return ok({ resume });
  } catch (error) {
    return fail(error, 400);
  }
}
