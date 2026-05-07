import { env } from "@/lib/env";

export function buildWhatsappSupportLink(message: string) {
  const base = env.supportWhatsappNumber.replace(/[^\d]/g, "");
  return `https://wa.me/${base}?text=${encodeURIComponent(message)}`;
}
