import { env } from "@/lib/env";

export async function sendTelegramAlert(message: string) {
  if (!env.telegramBotToken || !env.telegramChatId) {
    return;
  }

  const endpoint = `https://api.telegram.org/bot${env.telegramBotToken}/sendMessage`;

  await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      chat_id: env.telegramChatId,
      text: message,
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    }),
    cache: "no-store",
  }).catch(() => undefined);
}

export async function getIpAndLocation(req: Request) {
  const headers = req.headers;
  // Get IP
  const forwardedFor = headers.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : headers.get("x-real-ip") || "Unknown IP";

  // Check Vercel Geo Headers
  const country = headers.get("x-vercel-ip-country");
  const region = headers.get("x-vercel-ip-country-region");
  const city = headers.get("x-vercel-ip-city");

  if (country || region || city) {
    const locParts = [city, region, country].filter(Boolean);
    return {
      ip,
      location: locParts.join(", ") || "Unknown Location",
    };
  }

  // Fallback to IP Geolocation API if IP is not local/unknown
  if (ip && ip !== "Unknown IP" && ip !== "127.0.0.1" && ip !== "::1") {
    try {
      const res = await fetch(`http://ip-api.com/json/${ip}`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const data = await res.json();
        if (data.status === "success") {
          const locParts = [data.city, data.regionName, data.country].filter(Boolean);
          return {
            ip,
            location: locParts.join(", ") || "Unknown Location",
          };
        }
      }
    } catch (e) {
      console.error("IP Geolocation fallback failed:", e);
    }
  }

  return {
    ip,
    location: "Unknown Location",
  };
}

export type TelegramAlertPayload = {
  action: string;
  username: string;
  mobile: string;
  ipAddress: string;
  location: string;
  timestamp: string;
  details?: string;
};

export async function sendTelegramUserActionAlert(payload: TelegramAlertPayload) {
  const message = [
    `🚨 *User Action: ${payload.action}*`,
    `👤 *User:* \`${payload.username}\``,
    `📱 *Mobile:* \`${payload.mobile || "N/A"}\``,
    `📍 *Location:* \`${payload.location}\` (IP: \`${payload.ipAddress}\`)`,
    `⏰ *Time:* \`${payload.timestamp}\``,
    payload.details ? `📝 *Details:* ${payload.details}` : "",
  ].filter(Boolean).join("\n");

  await sendTelegramAlert(message);
}
