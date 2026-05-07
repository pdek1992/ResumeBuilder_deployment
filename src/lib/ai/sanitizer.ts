import type { AiOutputMode } from "@/lib/types";

const removableLinePatterns = [
  /^sure[,! ]/i,
  /^here(?:'| i)?s/i,
  /^i(?:'| a)m happy to/i,
  /^let me know/i,
  /^feel free to/i,
  /^based on the information provided/i,
  /^this should help/i,
  /^you can also/i,
  /^would you like/i,
  /^hope this helps/i,
];

export function sanitizeAiOutput(raw: string, mode: AiOutputMode) {
  let cleaned = raw.trim();

  cleaned = cleaned
    .replace(/^```(?:json|html|markdown|md|txt)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .replace(/^\s*["'`]+|["'`]+\s*$/g, "")
    .trim();

  const lines = cleaned
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => !removableLinePatterns.some((pattern) => pattern.test(line.trim())));

  cleaned = lines.join("\n").trim();

  cleaned = cleaned.replace(/^(Response|Answer|Output|Cover Letter|Summary)\s*:\s*/i, "").trim();

  if (mode === "RAW_TEXT" || mode === "RESUME_SECTION" || mode === "COVER_LETTER") {
    cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
  }

  if (mode === "HTML") {
    cleaned = cleaned.replace(/^<pre>\s*|<\/pre>$/g, "").trim();
  }

  if (mode === "JSON") {
    cleaned = extractJsonString(cleaned);
  }

  return cleaned;
}

function extractJsonString(value: string) {
  const objectMatch = value.match(/\{[\s\S]*\}$/);
  if (objectMatch) {
    return objectMatch[0];
  }

  const arrayMatch = value.match(/\[[\s\S]*\]$/);
  if (arrayMatch) {
    return arrayMatch[0];
  }

  return value;
}

export function validateAiOutput(mode: AiOutputMode, value: string) {
  switch (mode) {
    case "JSON":
      JSON.parse(value);
      return value;
    case "HTML":
      if (!value.startsWith("<")) {
        throw new Error("Expected HTML fragment");
      }
      return value;
    case "MOCK_INTERVIEW":
      if (!/question/i.test(value) || !/answer/i.test(value)) {
        throw new Error("Mock interview output format invalid");
      }
      return value;
    default:
      if (!value.trim()) {
        throw new Error("AI output was empty");
      }
      return value;
  }
}
