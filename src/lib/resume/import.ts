import mammoth from "mammoth";

/**
 * Extracts raw text from DOCX/DOC files.
 * Note: PDF extraction is now handled natively by Gemini in the API routes 
 * to avoid worker issues and improve quality.
 */
export async function extractResumeTextFromFile(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(".docx")) {
    const parsed = await mammoth.extractRawText({ buffer });
    return parsed.value;
  }

  if (lowerName.endsWith(".doc")) {
    return buffer.toString("utf8");
  }

  if (lowerName.endsWith(".pdf")) {
    throw new Error("PDF parsing is now handled by AI. Please use the AI-powered import routes.");
  }

  throw new Error("Unsupported file format");
}
