import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function loadLocalEnv() {
  if (process.env.VERCEL || process.env.CI) return;

  const envPath = join(process.cwd(), ".env");
  if (!existsSync(envPath)) return;

  for (const rawLine of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();

    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    process.env[key] ??= value;
  }
}

loadLocalEnv();

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "JWT_SECRET",
  "SESSION_SECRET",
  "CRON_SECRET",
];

const recommended = [
  "GEMINI_MODELS",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "NEXT_PUBLIC_APP_URL",
];

const apiKeyGroups = [
  { name: "GEMINI_API_KEYS", numberedPrefix: "GEMINI_API_KEY" },
  { name: "OPENAI_API_KEYS", numberedPrefix: "OPENAI_API_KEY" },
];

function mask(value) {
  if (!value) return "missing";
  if (value.length <= 8) return "set";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function validateUrl(name, value) {
  if (!value) return `${name} is missing`;

  try {
    new URL(value);
    return null;
  } catch {
    return `${name} is not a valid URL`;
  }
}

function parseKeyList(value) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function collectNumberedKeys(prefix) {
  const keys = [];
  let index = 1;

  while (process.env[`${prefix}_${index}`]) {
    keys.push(process.env[`${prefix}_${index}`]);
    index += 1;
  }

  return keys;
}

const failures = [];

for (const name of required) {
  if (!process.env[name]) {
    failures.push(`${name} is missing`);
  }
}

const supabaseUrlError = validateUrl("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
if (supabaseUrlError) failures.push(supabaseUrlError);

if (process.env.NEXT_PUBLIC_APP_URL) {
  const appUrlError = validateUrl("NEXT_PUBLIC_APP_URL", process.env.NEXT_PUBLIC_APP_URL);
  if (appUrlError) failures.push(appUrlError);
}

console.log("Environment health:");
for (const name of [...required, ...recommended]) {
  console.log(`- ${name}: ${mask(process.env[name])}`);
}
for (const group of apiKeyGroups) {
  const keys = [...parseKeyList(process.env[group.name]), ...collectNumberedKeys(group.numberedPrefix)];
  console.log(`- ${group.name}/${group.numberedPrefix}_N: ${keys.length ? `${keys.length} configured` : "missing"}`);
}

if (failures.length > 0) {
  console.error("\nEnvironment validation failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("\nEnvironment validation passed.");
