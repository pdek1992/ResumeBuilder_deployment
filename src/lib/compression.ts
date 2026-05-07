import { deflate, inflate } from "pako";

export function compressJson(value: unknown) {
  const serialized = JSON.stringify(value);
  const compressed = deflate(serialized);
  return Buffer.from(compressed).toString("base64");
}

export function decompressJson<T>(value: string, fallback: T): T {
  try {
    const inflated = inflate(Buffer.from(value, "base64"), { to: "string" });
    return JSON.parse(inflated) as T;
  } catch {
    return fallback;
  }
}
