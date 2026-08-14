import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { generateAiContent } from "@/lib/ai/service";
import { RESUME_SECTION_SYSTEM_PROMPT } from "@/lib/ai/prompts";

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdminClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { bullet, text, section, role, company, projectName } = await req.json();
    const sourceText = String(text ?? bullet ?? "").trim();

    if (!sourceText) {
      return NextResponse.json({ optimized: "", bullets: [] });
    }

    if (text) {
      const systemPrompt = [
        RESUME_SECTION_SYSTEM_PROMPT,
        "Convert pasted resume text into concise bullet points.",
        "Return ONLY a JSON array of strings.",
        "Do not delete facts. Split combined ideas into separate bullets when useful.",
        "Do not invent metrics. Keep every original technical detail, tool, project, and outcome.",
      ].join("\n");

      const aiResponse = await generateAiContent({
        mode: "JSON",
        prompt: JSON.stringify({
          section,
          role,
          company,
          projectName,
          sourceText,
        }),
        userId: session.user.id,
        systemPrompt,
        provider: "gemini",
      });

      const bullets = JSON.parse(aiResponse);
      return NextResponse.json({
        bullets: Array.isArray(bullets) ? bullets.map((item) => String(item).trim()).filter(Boolean) : [],
      });
    }

    const systemPrompt = `
      ${RESUME_SECTION_SYSTEM_PROMPT}
      Transform the user's job highlight into one high-impact accomplishment bullet.
      Apply the Bullet Constraint System and Bullet Quality Filter:
      - Start with a strong action verb (e.g. Architected, Automated, Engineered, Spearheaded).
      - Include precise technical context (the tools/stack used).
      - State the measurable/observable business or operational result (e.g., latency reduced, cost saved, uptime improved).
      - Keep it under one line where possible, concise, and highly scan-readable (under 5 seconds).
      - NEVER use clichés (results-driven, detail-oriented, passionate) or fake metrics.
      - Never fabricate facts or delete candidate-provided details.
      Role: ${role} at ${company}
    `;

    const aiResponse = await generateAiContent({
      mode: "RAW_TEXT",
      prompt: `Bullet to optimize: ${sourceText}`,
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
