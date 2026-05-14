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

const configuredGeminiModels = parseKeyList(process.env.GEMINI_MODELS);
const configuredOpenAiModels = parseKeyList(process.env.OPENAI_MODELS);
const configuredNvidiaModels = parseKeyList(process.env.NVIDIA_MODELS);

function collectNumberedKeys(prefix: string) {
  const keys: string[] = [];
  let i = 1;
  while (true) {
    const key = process.env[`${prefix}_${i}`];
    if (!key) break;
    keys.push(key.trim());
    i++;
  }
  return keys;
}

const geminiLegacyKeys = parseKeyList(process.env.GEMINI_API_KEYS);
const openAiLegacyKeys = parseKeyList(process.env.OPENAI_API_KEYS);

export const env = {
  // AI keys — support both comma-separated and individual numbered variables
  geminiApiKeys: Array.from(new Set([...collectNumberedKeys("GEMINI_API_KEY"), ...geminiLegacyKeys])),
  openAiApiKeys: Array.from(new Set([...collectNumberedKeys("OPENAI_API_KEY"), ...openAiLegacyKeys])),
  nvidiaApiKeys: parseKeyList(process.env.NVIDIA_API_KEYS || "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"),
  geminiModels: configuredGeminiModels.length
    ? configuredGeminiModels
    : ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-2.0-flash-lite-preview-02-05", "gemini-1.5-pro"],
  openAiModels: configuredOpenAiModels.length ? configuredOpenAiModels : ["gpt-4o-mini", "gpt-4o"],
  nvidiaModels: configuredNvidiaModels.length
    ? configuredNvidiaModels
    : ["nvidia/nemotron-3-super-120b-a12b", "meta/llama-3.3-70b-instruct", "meta/llama-3.1-8b-instruct"],

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
