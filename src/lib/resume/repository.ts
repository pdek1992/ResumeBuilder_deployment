import { compressJson, decompressJson } from "@/lib/compression";
import { calculateAtsScore, createDefaultResumeData } from "@/lib/resume/defaults";
import { defaultTemplates } from "@/lib/resume/templates";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { ResumeData, ResumeRecord, TemplateRecord } from "@/lib/types";

export async function listUserResumes(userId: string) {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("resumes")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  return (data as ResumeRecord[] | null) ?? [];
}

export async function getResumeForUser(userId: string, resumeId: string) {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("resumes")
    .select("*")
    .eq("user_id", userId)
    .eq("id", resumeId)
    .maybeSingle();

  return (data as ResumeRecord | null) ?? null;
}

export async function ensurePublicUserExists(userId: string) {
  const supabase = getSupabaseAdminClient();
  const { data: user } = await supabase.from("users").select("id").eq("id", userId).maybeSingle();

  if (!user) {
    // Fetch user info from auth to populate public profile if possible
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    const email = authUser?.user?.email ?? "";
    const name = authUser?.user?.user_metadata?.full_name ?? "";
    const parts = name.split(" ");
    
    await supabase.from("users").insert({
      id: userId,
      email: email,
      first_name: parts[0] || "User",
      last_name: parts.slice(1).join(" ") || "",
      is_admin: false,
      ai_config: {},
    });
  }
}

export async function createResumeDraft(userId: string, title = "Untitled Resume", initialData?: ResumeData) {
  await ensurePublicUserExists(userId);
  const supabase = getSupabaseAdminClient();
  const payload = initialData ?? createDefaultResumeData();
  const { data, error } = await supabase
    .from("resumes")
    .insert({
      user_id: userId,
      template_id: defaultTemplates[0].id,
      title,
      raw_json_compressed: compressJson(payload),
      parsed_sections: payload,
      current_draft_state: {
        activeSection: "personal",
      },
      ats_score: calculateAtsScore(payload),
      is_locked: false,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as ResumeRecord;
}

export async function saveResumeDraft({
  resumeId,
  userId,
  templateId,
  title,
  data,
  currentDraftState,
}: {
  resumeId: string;
  userId: string;
  templateId?: string;
  title?: string;
  data: ResumeData;
  currentDraftState?: Record<string, unknown>;
}) {
  const supabase = getSupabaseAdminClient();
  const atsScore = calculateAtsScore(data);

  const { data: existing } = await supabase.from("resumes").select("*").eq("id", resumeId).eq("user_id", userId).single();

  if (!existing) {
    throw new Error("Resume not found");
  }

  if (existing.is_locked) {
    throw new Error("Resume is locked and cannot be edited");
  }

  const { data: updated, error } = await supabase
    .from("resumes")
    .update({
      template_id: templateId ?? existing.template_id,
      title: title ?? existing.title,
      raw_json_compressed: compressJson(data),
      parsed_sections: data,
      current_draft_state: currentDraftState ?? existing.current_draft_state,
      ats_score: atsScore,
    })
    .eq("id", resumeId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  const oldPayload = decompressJson(existing.raw_json_compressed, createDefaultResumeData());
  if (JSON.stringify(oldPayload) !== JSON.stringify(data)) {
    await supabase.from("resume_versions").insert({
      resume_id: resumeId,
      version_data: data,
    });
  }

  return updated as ResumeRecord;
}

export async function toggleResumeLock(userId: string, resumeId: string, locked: boolean) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("resumes")
    .update({ is_locked: locked })
    .eq("id", resumeId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as ResumeRecord;
}

export async function duplicateResume(userId: string, resumeId: string) {
  const supabase = getSupabaseAdminClient();
  const { data: existing, error: fetchError } = await supabase
    .from("resumes")
    .select("*")
    .eq("id", resumeId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !existing) {
    throw new Error("Resume not found");
  }

  const { data, error } = await supabase
    .from("resumes")
    .insert({
      user_id: userId,
      template_id: existing.template_id,
      title: `${existing.title} (Copy)`,
      raw_json_compressed: existing.raw_json_compressed,
      parsed_sections: existing.parsed_sections,
      current_draft_state: existing.current_draft_state,
      ats_score: existing.ats_score,
      is_locked: false,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as ResumeRecord;
}

export async function listTemplates() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.from("templates").select("*").eq("active", true).order("template_name");

  if (error || !data || data.length === 0) {
    return defaultTemplates;
  }

  return data as TemplateRecord[];
}
