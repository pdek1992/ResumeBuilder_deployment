# SaaS Architecture

## Overview

The platform is structured as a secure Next.js App Router application deployed to Vercel with Supabase as the system of record for auth, profile state, resumes, payments, support, and audit logs.

## User Flow

1. User signs up with email/password or Google.
2. First and last name are captured once and locked.
3. User imports a resume or starts from a blank draft.
4. Draft is created in Postgres and autosaved on every meaningful change.
5. User chooses a template from metadata-backed template records.
6. AI features call backend routes only.
7. Razorpay payments are created and verified server-side.
8. Download access is granted for 24 hours by database-backed entitlement checks.
9. PDF and DOCX exports are generated server-side behind signed short-lived URLs.

## Runtime Boundaries

### Frontend

- React client components handle editing, autosave triggers, and checkout launch.
- No AI keys, service role keys, payment verification, or export logic run in the browser.
- Print CSS hides the preview surface to reduce print-to-PDF bypass.

### Backend

- Route handlers enforce auth, CSRF, origin checks, entitlement validation, and logging.
- Supabase service role is used only in server routes for protected writes.
- Payment verification, AI sanitation, support context assembly, and export generation are server-only.

## Data Model

### Identity

- `users` stores profile, consent, name lock, provider, and soft-delete markers.
- Password hashing remains in Supabase Auth. `users.password_hash` is reserved for migration compatibility.

### Content

- `resumes` stores compressed canonical state plus parsed JSON for debugging and analytics.
- `resume_versions` stores change history snapshots.
- `templates` stores dynamic template metadata and render config JSON.

### Monetization

- `payments` stores Razorpay order/payment linkage, status, expiry, and usage metadata.
- Resume download access is time-based.
- Mock interview access is one-payment, one-generation via `metadata_json.consumed`.

### Audit + Support

- `user_access_logs` captures every security-relevant action.
- `user_last_activity` enables quick last-seen lookup.
- `support_requests` stores editable user messages plus generated context.

## AI Pipeline

### Provider Strategy

- Gemini is attempted first.
- OpenAI is the fallback provider.
- Both providers support multiple keys from comma-separated env lists.
- Retry logic rotates key/provider on quota, timeout, throttling, and malformed output.

### Response Enforcement

Every AI call follows:

1. Compact prompt creation
2. Strict system instruction injection
3. Response generation
4. Sanitization
5. Mode-specific validation
6. Retry if invalid

Supported modes:

- `RAW_TEXT`
- `JSON`
- `HTML`
- `RESUME_SECTION`
- `COVER_LETTER`
- `MOCK_INTERVIEW`

## Security Controls

- Supabase SSR auth cookies
- CSRF token cookie + header validation on mutating routes
- Same-origin checks on server mutations
- CSP, frame, referrer, and MIME hardening in middleware
- Server-side Razorpay signature verification
- Signed 5-minute download tokens
- No client-side trust for paid access
- AI output sanitization before frontend delivery
- Access logging + Telegram alerts for sensitive events
- Database RLS for user-owned data

## Export Architecture

- HTML preview is client-visible and non-export authoritative.
- Server routes fetch canonical resume data from the database.
- PDF is rendered with `@react-pdf/renderer`.
- DOCX is rendered with `docx`.
- Download URLs are not permanent and require both session and token validation.

## Deployment Topology

- Next.js app deployed to Vercel
- Supabase Postgres + Auth
- Supabase Storage ready for resume media/profile photos
- Razorpay for payment collection
- Telegram bot for operational alerts

## Operational Notes

- A cron route is included to expire time-bound payments.
- Existing local secrets should be rotated before public release.
- For production scale, the current database-backed audit and throttling layer can be extended with a dedicated edge rate-limiter if traffic increases.
