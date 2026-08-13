import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatInr(amountInRupees: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amountInRupees);
}

export function toTitleCase(value: string) {
  return value.replace(/\w\S*/g, (token) => token[0].toUpperCase() + token.slice(1).toLowerCase());
}

export function compact<T>(values: Array<T | null | undefined | false>) {
  return values.filter(Boolean) as T[];
}

export function truncate(value: string, max = 160) {
  if (value.length <= max) {
    return value;
  }

  return `${value.slice(0, max - 1)}…`;
}

export function absoluteUrl(pathname = "/") {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return new URL(pathname, base).toString();
}

export function hexToRgba(hex: string, opacity: number): string {
  let cleanedHex = hex.replace("#", "");
  
  if (cleanedHex.length === 3) {
    cleanedHex = cleanedHex.split("").map((char) => char + char).join("");
  }
  
  if (cleanedHex.length !== 6) {
    return hex; // Fallback if invalid
  }

  const r = parseInt(cleanedHex.substring(0, 2), 16);
  const g = parseInt(cleanedHex.substring(2, 4), 16);
  const b = parseInt(cleanedHex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
