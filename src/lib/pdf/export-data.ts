import { decompressJson } from "@/lib/compression";
import { createDefaultResumeData } from "@/lib/resume/defaults";
import type { ResumeData, ResumeRecord } from "@/lib/types";

export function resumeRecordToData(resume: ResumeRecord): ResumeData {
  return decompressJson(resume.raw_json_compressed, createDefaultResumeData());
}
