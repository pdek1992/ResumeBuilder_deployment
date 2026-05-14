import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { generateAiContent } from "@/lib/ai/service";

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdminClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { bullet, role, company } = await req.json();

    const systemPrompt = `
      You are an expert resume writer. Transform the user's job highlight into a high-impact, quantifiable accomplishment bullet.
      Use action verbs and follow the XYZ formula (Accomplished [X] as measured by [Y], by doing [Z]).
      Keep it professional and concise. Output ONLY the optimized bullet text.
      Role: ${role} at ${company}
    `;

    const aiResponse = await generateAiContent({
      mode: "RAW_TEXT",
      prompt: `Bullet to optimize: ${bullet}`,
      userId: session.user.id,
      systemPrompt,
      provider: "gemini",
    });

    return NextResponse.json({ optimized: aiResponse.trim() });
  } catch (error) {
    console.error("Optimize Bullet Error:", error);
    return NextResponse.json({ error: "Failed to optimize bullet" }, { status: 500 });
  }
}
