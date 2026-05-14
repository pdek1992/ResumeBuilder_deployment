import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { generateAiContent } from "@/lib/ai/service";
import { CHAT_RESUME_PROMPT } from "@/lib/ai/prompts";

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdminClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { resumeId, prompt, currentData } = await req.json();

    const systemPrompt = `${CHAT_RESUME_PROMPT}\n\nCurrent Resume Data:\n${JSON.stringify(currentData, null, 2)}`;

    const aiResponse = await generateAiContent({
      mode: "JSON",
      prompt: `User Request: ${prompt}`,
      userId: session.user.id,
      systemPrompt,
      provider: "gemini",
    });

    // Clean the response
    const cleaned = aiResponse.replace(/```json|```/g, "").trim();
    const result = JSON.parse(cleaned);

    return NextResponse.json(result);
  } catch (error) {
    console.error("AI Chat Error:", error);
    return NextResponse.json({ error: "Failed to process AI chat" }, { status: 500 });
  }
}
