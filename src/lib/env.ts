function parseKeyList(value?: string) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  // AI keys — comma-separated rotation lists
  geminiApiKeys: parseKeyList(process.env.GEMINI_API_KEYS),
  openAiApiKeys: parseKeyList(process.env.OPENAI_API_KEYS),

  // Razorpay — server-side only
  razorpayKeyId: process.env.RAZORPAY_KEY_ID ?? "",
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ?? "",

  // Pricing (INR)
  resumeDownloadPrice: parseNumber(process.env.RESUME_DOWNLOAD_PRICE, 100),
  mockInterviewPrice: parseNumber(process.env.MOCK_INTERVIEW_PRICE, 149),
  coverLetterPrice: parseNumber(process.env.COVER_LETTER_PRICE, 49),

  // Notifications
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
  telegramChatId: process.env.TELEGRAM_CHAT_ID ?? "",
  supportWhatsappNumber: process.env.SUPPORT_WHATSAPP_NUMBER ?? "9823340379",

  // Supabase
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",

  // App
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  supportEmail: process.env.SUPPORT_EMAIL ?? "support@vigilsiddhi.com",
  adminEmails: parseKeyList(process.env.ADMIN_EMAILS),

  // Security
  jwtSecret: process.env.JWT_SECRET ?? "",
  sessionSecret: process.env.SESSION_SECRET ?? "",
  cronSecret: process.env.CRON_SECRET ?? "",
};

export function assertServerEnv(keys: Array<keyof typeof env>) {
  const missing = keys.filter((key) => {
    const value = env[key];

    if (Array.isArray(value)) {
      return value.length === 0;
    }

    return !value;
  });

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}
