import { compressJson, decompressJson } from "@/lib/compression";
import { calculateAtsScore, createDefaultResumeData } from "@/lib/resume/defaults";
import { defaultTemplates } from "@/lib/resume/templates";
import { ensureAppUserProfile } from "@/lib/auth/profile-sync";
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
  await ensureAppUserProfile({ userId });
}

function shouldRetryWithoutContent(error: { code?: string; message?: string }) {
  return error.code === "PGRST204" || error.message?.toLowerCase().includes("content");
}

function isForeignKeyError(error: { code?: string }) {
  return error.code === "23503";
}

async function insertResumeRecord(userId: string, title: string, payload: ResumeData, includeContent = true) {
  const supabase = getSupabaseAdminClient();
  const insertPayload: Record<string, unknown> = {
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
  };

  if (includeContent) {
    insertPayload.content = payload;
  }

  return supabase.from("resumes").insert(insertPayload).select("*").single();
}

export async function createResumeDraft(userId: string, title = "Untitled Resume", initialData?: ResumeData) {
  await ensurePublicUserExists(userId);
  const payload = initialData ?? createDefaultResumeData();
  let { data, error } = await insertResumeRecord(userId, title, payload);

  if (error && isForeignKeyError(error)) {
    await ensurePublicUserExists(userId);
    ({ data, error } = await insertResumeRecord(userId, title, payload));
  }

  if (error && shouldRetryWithoutContent(error)) {
    ({ data, error } = await insertResumeRecord(userId, title, payload, false));
  }

  if (error) {
    if (error.code === '23503') {
      console.error("[RESUME_CREATE] CRITICAL FK ERROR: User/profile row does not exist even after sync attempt.", error);
    }
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

  const updatePayload: Record<string, unknown> = {
    template_id: templateId ?? existing.template_id,
    title: title ?? existing.title,
    content: data,
    raw_json_compressed: compressJson(data),
    parsed_sections: data,
    current_draft_state: currentDraftState ?? existing.current_draft_state,
    ats_score: atsScore,
  };

  let { data: updated, error } = await supabase
    .from("resumes")
    .update(updatePayload)
    .eq("id", resumeId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error && shouldRetryWithoutContent(error)) {
    delete updatePayload.content;
    ({ data: updated, error } = await supabase
      .from("resumes")
      .update(updatePayload)
      .eq("id", resumeId)
      .eq("user_id", userId)
      .select("*")
      .single());
  }

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

  const duplicatePayload: Record<string, unknown> = {
    user_id: userId,
    template_id: existing.template_id,
    title: `${existing.title} (Copy)`,
    content: (existing as ResumeRecord & { content?: unknown }).content ?? decompressJson(existing.raw_json_compressed, createDefaultResumeData()),
    raw_json_compressed: existing.raw_json_compressed,
    parsed_sections: existing.parsed_sections,
    current_draft_state: existing.current_draft_state,
    ats_score: existing.ats_score,
    is_locked: false,
  };

  let { data, error } = await supabase
    .from("resumes")
    .insert(duplicatePayload)
    .select("*")
    .single();

  if (error && shouldRetryWithoutContent(error)) {
    delete duplicatePayload.content;
    ({ data, error } = await supabase
      .from("resumes")
      .insert(duplicatePayload)
      .select("*")
      .single());
  }

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
