# VigilSiddhi AI Resume Builder — Codeflow Documentation

> **Stack:** Next.js 16 (App Router, Turbopack) · TypeScript · Supabase (Auth + DB) · Tailwind CSS · Gemini & OpenAI APIs · Razorpay

---

## Table of Contents
1. [Project Structure](#1-project-structure)
2. [Configuration & Environment](#2-configuration--environment)
3. [Core Type System](#3-core-type-system)
4. [Supabase Clients](#4-supabase-clients)
5. [Authentication Layer](#5-authentication-layer)
6. [Security Layer](#6-security-layer)
7. [AI Layer](#7-ai-layer)
8. [Resume Business Logic](#8-resume-business-logic)
9. [Utility Libraries](#9-utility-libraries)
10. [API Routes](#10-api-routes)
11. [Client-Side API Helper](#11-client-side-api-helper)
12. [Database Schema Overview](#12-database-schema-overview)
13. [Request Lifecycle](#13-request-lifecycle)

---

## 1. Project Structure

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── api/                # All server-side API endpoints
│   │   ├── account/        # User account management
│   │   ├── ai/             # AI generation endpoints
│   │   ├── auth/           # Auth callbacks & session events
│   │   ├── cover-letters/  # Cover letter CRUD
│   │   ├── cron/           # Scheduled cleanup jobs
│   │   ├── csrf/           # CSRF token issuing endpoint
│   │   ├── downloads/      # PDF & DOCX download endpoints
│   │   ├── mock-interviews/# Mock interview generation
│   │   ├── payments/       # Razorpay order & verification
│   │   ├── resumes/        # Resume CRUD & lifecycle
│   │   ├── support/        # Support request handling
│   │   ├── templates/      # Template listing
│   │   └── track/          # Analytics event tracking
│   ├── builder/            # Resume builder UI pages
│   ├── dashboard/          # User dashboard
│   ├── settings/           # Account & security settings
│   ├── sign-in/            # Login page
│   └── sign-up/            # Registration page
├── components/             # React UI components
│   ├── auth/               # Login/signup forms
│   ├── builder/            # Template picker, import UI
│   ├── editor/             # The main resume editor
│   ├── marketing/          # Landing page sections
│   ├── providers/          # Context providers
│   ├── settings/           # Passkey & 2FA cards
│   ├── support/            # Support widget
│   └── ui/                 # Design system primitives (Button, Input, etc.)
├── lib/                    # Shared server & client libraries
│   ├── ai/                 # AI service, prompts, sanitizer
│   ├── downloads/          # PDF/DOCX generation utilities
│   ├── payments/           # Razorpay helpers
│   ├── pdf/                # PDF rendering helpers
│   ├── resume/             # Resume CRUD, defaults, templates
│   ├── security/           # CSRF, rate-limit, request guards
│   ├── supabase/           # Supabase client factories
│   ├── api-response.ts     # ok() / fail() response helpers
│   ├── auth.ts             # Server-side user/profile helpers
│   ├── client-api.ts       # Client-side fetch wrapper with CSRF
│   ├── compression.ts      # pako gzip compress/decompress
│   ├── env.ts              # Typed environment variable registry
│   ├── logging.ts          # User action logger → DB + Telegram
│   ├── telegram.ts         # Telegram bot alert sender
│   ├── types.ts            # All shared TypeScript types
│   ├── utils.ts            # General utility functions
│   └── whatsapp.ts         # WhatsApp support link generator
└── types/                  # Additional ambient type declarations
```

---

## 2. Configuration & Environment

### `src/lib/env.ts`
**Purpose:** Centralized, typed registry for all environment variables.

| Export | Description |
|--------|-------------|
| `env` | Object containing all parsed env vars |
| `assertServerEnv(keys[])` | Throws if any listed key is missing/empty |

**Key env vars:**
- `GEMINI_API_KEYS` / `OPENAI_API_KEYS` — comma-separated lists for key rotation
- `SUPABASE_SERVICE_ROLE_KEY` — admin-level Supabase access (server only)
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — payment gateway credentials
- `JWT_SECRET` — used to sign download tokens
- `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` — for real-time server alerts

**Helper functions:**
- `parseKeyList(value)` — splits comma-separated string into a trimmed string array
- `parseNumber(value, fallback)` — safely converts string to number with fallback

---

### `next.config.ts`
**Purpose:** Next.js build & runtime configuration.

```ts
serverExternalPackages: ["pdfjs-dist", "pdf-parse"]
```
> Prevents Next.js from bundling these libraries, letting Node.js resolve them natively. This resolves the `pdf.worker.mjs` resolution error in both local dev and Vercel production.

---

## 3. Core Type System

### `src/lib/types.ts`
All shared TypeScript interfaces and union types used across the entire application.

| Type | Description |
|------|-------------|
| `ResumeData` | The complete resume JSON structure (personal, experience, education, skills, etc.) |
| `ResumeRecord` | Database row shape for the `resumes` table |
| `UserProfile` | Database row shape for the `users` table |
| `TemplateRecord` | Database row shape for the `templates` table |
| `AiOutputMode` | Union: `"RAW_TEXT" \| "JSON" \| "HTML" \| "RESUME_SECTION" \| "COVER_LETTER" \| "MOCK_INTERVIEW"` |
| `PaymentType` | Union: `"resume_download" \| "mock_interview" \| "cover_letter"` |
| `PaymentStatus` | Union: `"created" \| "paid" \| "failed" \| "expired" \| "refunded"` |
| `AccessActionType` | Union of all loggable user actions (signup, login, ai_generation, etc.) |
| `ResumeSectionKey` | Union of all resume section names |
| `AccessLogPayload` | Input shape for `logUserAction()` |
| `MockInterviewItem` | Single Q&A item in a mock interview |
| `SupportContext` | Context object sent to the support AI |

---

## 4. Supabase Clients

### `src/lib/supabase/server.ts`
**Purpose:** Creates a Supabase client that reads/writes the authenticated user's session cookies inside server components and API routes.

```ts
export async function getSupabaseServerClient()
```
- Uses `@supabase/ssr`'s `createServerClient` with the **anon key**
- The `setAll` cookie handler is wrapped in `try/catch` — prevents crash during SSR render phase (cookies can only be set in Server Actions or Route Handlers)
- Returns the client typed as `any` to avoid complex generic inference

### `src/lib/supabase/admin.ts` *(referenced but not shown)*
- Creates a Supabase client using the **Service Role key** (bypasses RLS)
- Used only in server-side operations that need admin access (writing logs, creating resumes, etc.)

---

## 5. Authentication Layer

### `src/lib/auth.ts`
Server-side authentication helpers used by pages and API routes.

| Function | Description |
|----------|-------------|
| `getCurrentUser()` | Calls `supabase.auth.getUser()` → returns `User \| null` |
| `getCurrentUserProfile()` | Gets `User` then queries the `users` table → returns `UserProfile \| null` |
| `requireUserProfile()` | Calls `getCurrentUserProfile()`, redirects to `/sign-in` if null |

**Flow:**
```
Request → getCurrentUser() → auth.getUser() → Supabase JWT
                           ↓
                    getCurrentUserProfile() → DB users table
                           ↓
                    requireUserProfile() → redirect if unauthenticated
```

---

## 6. Security Layer

### `src/lib/security/csrf.ts`
**Purpose:** Double-Submit Cookie pattern for CSRF protection.

| Function | Description |
|----------|-------------|
| `generateCsrfCookieValue()` | Generates a cryptographic random token |
| `getOrCreateCsrfToken()` | Reads existing `vrb_csrf` cookie or creates one |
| `assertCsrf()` | Validates `x-csrf-token` header matches `vrb_csrf` cookie — throws if mismatch |

**How it works:**
1. On first load, `/api/csrf` sets the `vrb_csrf` cookie and returns the token
2. `client-api.ts` reads the cookie and sends it as `x-csrf-token` header
3. Every mutating API route calls `assertCsrf()` to validate the pair

---

### `src/lib/security/rate-limit.ts`
**Purpose:** Database-backed rate limiting using the `user_access_logs` table.

```ts
export async function assertRateLimit({
  actionType, userId, ipAddress, max, windowMinutes
})
```
- Counts rows in `user_access_logs` matching `action_type` within the time window
- Throws `"Rate limit exceeded"` if count ≥ `max`
- Filters by `userId` (authenticated) or `ipAddress` (anonymous)

---

### `src/lib/security/request.ts`
**Purpose:** Guards API routes against cross-origin and cross-site requests.

| Function | Description |
|----------|-------------|
| `getRequestMetadata()` | Extracts `ipAddress`, `userAgent`, `origin`, `referer` from request headers |
| `assertSafeOrigin()` | Blocks requests whose `origin` or `referer` doesn't match the app host |

- In development mode (`NODE_ENV === "development"`), `localhost` origins are allowed
- In production, only requests matching `NEXT_PUBLIC_APP_URL` or the server `host` pass

---

### `src/lib/security/tokens.ts`
Exports `generateRandomToken()` — a cryptographic helper used by the CSRF module to create unpredictable session tokens.

---

## 7. AI Layer

### `src/lib/ai/service.ts`
**Purpose:** The central AI orchestration engine with key rotation, provider fallback, and retry logic.

#### `generateAiContent(input)` — Main Export

**Input:**
```ts
{
  mode: AiOutputMode;        // Controls output format & system prompt
  prompt: string;            // The user prompt
  userId: string;            // For logging & fetching user AI keys
  systemPrompt?: string;     // Optional override system prompt
  provider?: "gemini" | "openai"; // Optional provider lock
  metadata?: Record<string, unknown>;
}
```

**Execution flow:**
1. **Fetch user AI config** from the `users` table via Supabase admin client
2. **Determine key pools**: use user's own keys if set, else fall back to global env keys
3. **Build provider list**: both Gemini + OpenAI unless `provider` override is set
4. **Rotate keys**: use `rotate()` to spread load across all available API keys
5. **Try each key**: call either `generateWithGemini()` or `generateWithOpenAI()`
6. **Sanitize** output with `sanitizeAiOutput(raw, mode)`
7. **Validate** output with `validateAiOutput(mode, sanitized)`
8. **Advance cursor** so next call uses the next key in the list
9. **Log** the successful generation to `user_access_logs` + Telegram
10. On failure: **log suspicious activity** and throw a final error

#### Helper Functions

| Function | Description |
|----------|-------------|
| `buildSystemPrompt(mode)` | Builds a strict instruction set telling AI to return only requested output |
| `rotate(items, startIndex)` | Creates a rotated view of an array for round-robin key selection |
| `isRetryableError(error)` | Returns true for quota/rate/429/timeout errors (triggers key rotation) |

---

### `src/lib/ai/prompts.ts`
**Purpose:** Stores all AI prompt templates as exported constants.

| Export | Description |
|--------|-------------|
| `RESUME_JSON_PROMPT` | Instructs AI to parse raw text into a full `ResumeData` JSON object |
| `RESUME_ANALYSIS_PROMPT` | Instructs AI to analyze a resume and return a scored `ResumeAnalysis` object |
| `CHAT_RESUME_PROMPT` | Instructs AI to return RFC 6902 JSON Patch operations for conversational editing |

---

### `src/lib/ai/sanitizer.ts`
**Purpose:** Strips AI "noise" from responses before returning to the caller.

| Function | Description |
|----------|-------------|
| `sanitizeAiOutput(raw, mode)` | Removes code fences, chatbot phrases, prefixes, and normalizes whitespace |
| `extractJsonString(value)` | Extracts the first `{...}` or `[...]` block from a string |
| `validateAiOutput(mode, value)` | Mode-specific validation: parses JSON, checks HTML/interview format |

**Patterns removed by `sanitizeAiOutput`:**
- Markdown code fences (\`\`\`json, \`\`\`html, etc.)
- Chatbot phrases: "Sure,", "Here's", "Feel free to", "Would you like", etc.
- Response labels: "Response:", "Answer:", "Cover Letter:"
- Excessive blank lines in text modes

---

## 8. Resume Business Logic

### `src/lib/resume/repository.ts`
**Purpose:** All Supabase database operations for the `resumes` table.

| Function | Description |
|----------|-------------|
| `listUserResumes(userId)` | Fetches all resumes for a user, ordered by `updated_at` desc |
| `getResumeForUser(userId, resumeId)` | Fetches a single resume owned by the user |
| `createResumeDraft(userId, title?, initialData?)` | Inserts a new resume record with compressed JSON |
| `saveResumeDraft({resumeId, userId, data, ...})` | Updates resume data; blocks if `is_locked = true`; auto-creates a version snapshot |
| `toggleResumeLock(userId, resumeId, locked)` | Sets `is_locked` true/false |
| `duplicateResume(userId, resumeId)` | Copies an existing resume with "Copy" suffix in title |
| `listTemplates()` | Fetches active templates from DB; falls back to `defaultTemplates` |

**Version history:** Every time `saveResumeDraft` detects a JSON change, it inserts a row into `resume_versions`.

---

### `src/lib/resume/defaults.ts`
**Purpose:** Factory functions for creating empty resume sections.

| Function | Description |
|----------|-------------|
| `createDefaultResumeData()` | Returns a blank `ResumeData` object with one placeholder entry per section |
| `calculateAtsScore(resume)` | Heuristic ATS score 0–99 based on completeness of resume fields |
| `resumeSectionAliases` | Map of section keys to common alternative names (for AI parsing) |

**ATS Score Breakdown:**
- Base: 45 points
- Name filled: +10
- Summary >120 chars: +10
- Work experience: +10
- Education: +7
- 5+ skills: +8
- JD provided: +5
- Projects: +3
- Certifications: +2
- Capped at 99

---

### `src/lib/resume/import.ts`
**Purpose:** Extracts raw text from uploaded resume files.

```ts
export async function extractResumeTextFromFile(file: File): Promise<string>
```
- `.pdf` → uses `PDFParse` (with explicit CDN worker URL set via `PDFParse.setWorker()`)
- `.docx` → uses `mammoth.extractRawText()`
- `.doc` → basic UTF-8 string conversion
- Throws for unsupported formats

---

### `src/lib/resume/templates.ts`
**Purpose:** Static default template definitions used as fallback when the DB has no templates.

Each template has:
- `id`, `template_name`, `description`, `tags[]`
- `config_json: ResumeThemeConfig` — accent color, typography, layout columns, density

---

## 9. Utility Libraries

### `src/lib/compression.ts`
Uses `pako` (zlib) to compress/decompress resume JSON for efficient database storage.

| Function | Description |
|----------|-------------|
| `compressJson(value)` | JSON.stringify → deflate → base64 string |
| `decompressJson<T>(value, fallback)` | base64 → inflate → JSON.parse; returns fallback on error |

---

### `src/lib/logging.ts`
**Purpose:** Single function for recording every significant user action.

```ts
export async function logUserAction({ userId, actionType, metadata })
```
1. Inserts a row into `user_access_logs` with IP, user-agent, and metadata
2. Upserts `user_last_activity` with current timestamp
3. Sends a Markdown-formatted alert to Telegram (fire-and-forget, `.catch()` suppressed)

---

### `src/lib/telegram.ts`
**Purpose:** Sends alerts to a Telegram bot channel.

```ts
export async function sendTelegramAlert(message: string)
```
- No-ops silently if `TELEGRAM_BOT_TOKEN` or `TELEGRAM_CHAT_ID` is not configured
- Uses `parse_mode: "Markdown"` for formatted messages

---

### `src/lib/api-response.ts`
**Purpose:** Thin wrappers around `NextResponse.json()` for consistent API responses.

| Function | Description |
|----------|-------------|
| `ok(data, init?)` | Returns `200 OK` JSON response |
| `fail(error, status?)` | Returns error JSON response (default `400`) |

---

### `src/lib/utils.ts`
General-purpose utility functions.

| Function | Description |
|----------|-------------|
| `cn(...inputs)` | Merges Tailwind class names using clsx + tailwind-merge |
| `sleep(ms)` | Returns a Promise that resolves after `ms` milliseconds |
| `safeJsonParse<T>(value, fallback)` | JSON.parse with fallback on error |
| `slugify(value)` | Converts string to URL-safe slug |
| `formatInr(amount)` | Formats number as Indian Rupee (e.g., ₹1,499) |
| `toTitleCase(value)` | Capitalizes first letter of each word |
| `compact(values)` | Filters nulls/undefined/false from array |
| `truncate(value, max)` | Truncates string to max chars with ellipsis |
| `absoluteUrl(pathname)` | Builds full URL using `NEXT_PUBLIC_APP_URL` |

---

### `src/lib/whatsapp.ts`
Generates a WhatsApp click-to-chat URL using the support number from env.

---

## 10. API Routes

All API routes follow the pattern:
```ts
export const runtime = "nodejs";     // Always Node.js (never edge)

export async function POST(request: Request) {
  await assertSafeOrigin();          // 1. Block cross-site requests
  await assertCsrf();                // 2. Validate CSRF token
  // ... auth check ...              // 3. Get authenticated user
  await assertRateLimit({...});      // 4. Check rate limits
  // ... business logic ...          // 5. Do the actual work
  return ok({ ... });                // 6. Return response
}
```

### AI Routes (`/api/ai/`)

| Route | Method | Description |
|-------|--------|-------------|
| `parse-pdf` | POST | Accepts PDF file upload, extracts text via PDFParse, sends to AI with `RESUME_JSON_PROMPT`, returns parsed `ResumeData` JSON |
| `parse-docx` | POST | Same as above but for `.docx` files via Mammoth |
| `generate` | POST | Generic AI generation endpoint, supports all `AiOutputMode` values |
| `analyze-resume` | POST | Sends resume JSON to AI with `RESUME_ANALYSIS_PROMPT`, returns ATS score & feedback |
| `chat` | POST | Accepts resume JSON + user message, returns JSON Patch operations + explanation |
| `optimize-bullet` | POST | Takes a single bullet point, rewrites it using XYZ achievement formula |

### Resume Routes (`/api/resumes/`)

| Route | Method | Description |
|-------|--------|-------------|
| `/` | GET | List all resumes for authenticated user |
| `/` | POST | Create a new blank resume draft |
| `/save` | POST | Save resume data (blocked if locked) |
| `/lock` | POST | Toggle `is_locked` flag |
| `/duplicate` | POST | Create a copy of a resume |
| `/import` | POST | Import from uploaded file (PDF/DOCX) |

### Auth Routes (`/api/auth/`)

| Route | Description |
|-------|-------------|
| `callback` | OAuth callback handler (Google SSO) |
| `logout` | Signs out user via Supabase, clears session |
| `session-event` | Handles session refresh events from the client |

### Payment Routes (`/api/payments/`)

| Route | Description |
|-------|-------------|
| `create-order` | Creates a Razorpay order, stores in DB |
| `verify` | Verifies Razorpay payment signature, unlocks download token |

### Download Routes (`/api/downloads/`)

| Route | Description |
|-------|-------------|
| `token` | Issues a short-lived JWT download token (after payment verified) |
| `pdf` | Validates token, generates PDF using `@react-pdf/renderer`, streams file |
| `docx` | Validates token, generates DOCX using `docx` library, streams file |

### Other Routes

| Route | Description |
|-------|-------------|
| `/api/csrf` | Issues a new CSRF token (sets cookie + returns JSON) |
| `/api/cover-letters` | CRUD for cover letters tied to a resume |
| `/api/mock-interviews` | Generates mock interview Q&A for a resume |
| `/api/support` | Sends support request with AI-enriched context |
| `/api/templates` | Lists available resume templates |
| `/api/track` | Records analytics events (client-side tracking) |
| `/api/account/ai-settings` | Save user's personal Gemini/OpenAI API keys |
| `/api/account/delete` | Permanent account deletion |
| `/api/cron/cleanup-expired` | Cron job to purge expired payment orders |

---

## 11. Client-Side API Helper

### `src/lib/client-api.ts`
**Purpose:** A typed `fetch` wrapper that automatically attaches CSRF tokens to every request.

```ts
export async function apiFetch<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T>
```

**Flow:**
1. Reads `vrb_csrf` from `document.cookie`
2. If missing, fetches a fresh token from `/api/csrf`
3. Adds `content-type: application/json` and `x-csrf-token` headers to all requests
4. Parses JSON response body
5. Throws an error if `response.ok` is false (using the `error` field from the response)

**Used by:** all client components making mutations (save, generate, download, etc.)

---

## 12. Database Schema Overview

| Table | Purpose |
|-------|---------|
| `users` | Extended user profile (name, mobile, AI config, lock flags) |
| `resumes` | Resume records with compressed JSON, ATS score, lock status |
| `resume_versions` | Auto-saved version history snapshots |
| `templates` | Resume template definitions |
| `payments` | Razorpay order records |
| `cover_letters` | AI-generated cover letters linked to resumes |
| `mock_interviews` | AI-generated Q&A sets linked to resumes |
| `user_access_logs` | Every user action (used for rate limiting + audit) |
| `user_last_activity` | Last active timestamp per user |

---

## 13. Request Lifecycle

### Typical Mutating API Request (e.g., Save Resume)

```
Browser
  │
  ├─ apiFetch("/api/resumes/save", { method: "POST", body: JSON })
  │    └─ Reads vrb_csrf cookie → adds x-csrf-token header
  │
Server (Next.js Route Handler)
  │
  ├─ assertSafeOrigin()     → checks Origin/Referer headers
  ├─ assertCsrf()           → validates x-csrf-token === vrb_csrf cookie
  ├─ getSupabaseServerClient().auth.getUser() → verify JWT session
  ├─ assertRateLimit(...)   → count recent actions in user_access_logs
  │
  ├─ Business Logic
  │    └─ saveResumeDraft() → compressJson → Supabase upsert → version snapshot
  │
  ├─ logUserAction()        → insert to user_access_logs + sendTelegramAlert()
  │
  └─ ok({ ... })            → NextResponse.json 200
```

### AI Generation Request (e.g., Parse PDF)

```
Browser
  │
  ├─ POST /api/ai/parse-pdf (FormData with file)
  │
Server
  │
  ├─ Auth + CSRF + Rate limit guards
  ├─ PDFParse.getText()     → extract raw text from PDF
  │    └─ Worker: CDN pdfjs-dist@5.4.296/pdf.worker.min.mjs
  │
  ├─ generateAiContent({mode: "JSON", prompt})
  │    ├─ Fetch user's personal AI keys from users.ai_config
  │    ├─ Rotate through Gemini → OpenAI providers
  │    ├─ sanitizeAiOutput() → strip fences, chatbot phrases
  │    ├─ validateAiOutput() → JSON.parse verify
  │    └─ logUserAction("ai_generation")
  │
  └─ ok({ data: parsedResume })
```

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| All AI calls server-side | API keys never exposed to browser |
| CSRF double-submit pattern | Prevents CSRF attacks on all mutating endpoints |
| Key rotation across Gemini+OpenAI | Maximizes throughput, handles quota limits gracefully |
| pako compression for resume JSON | Reduces DB storage; large resumes can exceed 10KB uncompressed |
| pdf.worker via CDN | Avoids Next.js module bundling issues with pdfjs-dist on Vercel |
| `serverExternalPackages` for pdfjs | Lets Node.js resolve native ESM worker without bundler interference |
| Resume lock system | Prevents accidental edits to finalized "submitted" resumes |
| Version history on save | Allows future "restore previous version" feature |
| Telegram alerts | Real-time monitoring without external APM costs |
