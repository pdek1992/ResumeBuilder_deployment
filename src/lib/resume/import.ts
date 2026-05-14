import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

export async function extractResumeTextFromFile(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(".pdf")) {
    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    await parser.destroy();
    return parsed.text;
  }

  if (lowerName.endsWith(".docx")) {
    const parsed = await mammoth.extractRawText({ buffer });
    return parsed.value;
  }

  if (lowerName.endsWith(".doc")) {
    return buffer.toString("utf8");
  }

  throw new Error("Unsupported file format");
}
