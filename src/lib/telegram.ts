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
