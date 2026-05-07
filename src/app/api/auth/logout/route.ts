import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { logUserAction } from "@/lib/logging";
import { assertSafeOrigin } from "@/lib/security/request";

export async function POST(request: Request) {
  try {
    await assertSafeOrigin();
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await logUserAction({
        userId: user.id,
        actionType: "logout",
      });
    }

    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/", request.url));
  } catch {
    return NextResponse.redirect(new URL("/settings", request.url));
  }
}
