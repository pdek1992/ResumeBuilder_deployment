# VigilSiddhiAI Resume Builder

Production-grade AI resume SaaS rebuilt on Next.js App Router, Supabase, Vercel serverless APIs, Razorpay, and a backend-only AI pipeline with strict response sanitization.

## Stack

- Next.js 16 App Router
- TailwindCSS
- Supabase Auth, Postgres, Storage-ready architecture
- Razorpay server-side payment verification
- Gemini primary + OpenAI fallback with key rotation
- React PDF server-side export

## What Changed

- Replaced the old static GitHub Pages flow with authenticated SSR pages and protected APIs.
- Moved AI generation, payment validation, PDF/DOCX export, and download access checks to the server.
- Added locked identity profiles, autosaved resume drafts, template metadata, cover letters, mock interviews, support context, access logging, DPDP-ready account deletion, and Telegram alerts.
- Added centralized AI output sanitization and format validation before anything reaches the frontend.

## Primary Routes

- `/` marketing + entry
- `/sign-up`
- `/sign-in`
- `/dashboard`
- `/builder/import`
- `/builder/templates`
- `/builder/[resumeId]`
- `/settings`
- `/privacy-policy`
- `/terms`

## API Surface

- `POST /api/auth/session-event`
- `POST /api/resumes`
- `POST /api/resumes/import`
- `POST /api/resumes/save`
- `POST /api/ai/generate`
- `POST /api/payments/create-order`
- `POST /api/payments/verify`
- `POST /api/downloads/token`
- `GET /api/downloads/pdf`
- `GET /api/downloads/docx`
- `POST /api/cover-letters`
- `POST /api/mock-interviews`
- `GET|POST /api/support`
- `POST /api/account/delete`

## Environment

Use `.env.example` as the source of truth for required variables.

Important:
- Do not expose service role, AI keys, or Razorpay secret to the browser.
- Rotate any previously leaked local credentials before public deployment.

## Local Development

```bash
npm install
npm run dev
```

## Production Validation

```bash
npm run build
```

## Documentation

- Architecture: [SAAS_ARCHITECTURE.md](./SAAS_ARCHITECTURE.md)
- Deployment: [DEPLOY.md](./DEPLOY.md)
- API spec: [openapi.yaml](./openapi.yaml)
- Database: [schema.sql](./schema.sql)
