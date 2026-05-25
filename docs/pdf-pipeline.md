# Secure High-Fidelity GHA Puppeteer PDF Generation Pipeline

This document details the production-grade secure PDF generation pipeline utilizing **GitHub Actions runners** as the offloaded compute backend and **Puppeteer** for pixel-perfect template replicas.

---

## 1. Architectural Overview

```text
User → Vercel App (/api/downloads/pdf?token=...)
           |
           |-- (Checks database. If fresh PDF exists in Supabase Storage → redirects immediately!)
           |
           |-- (If not, inserts row in `pdf_generation_jobs` table)
           |-- (Signs jobId/timestamp/nonce via HMAC-SHA256 signature using RENDER_SECRET)
           |-- (Securely fires GHA workflow_dispatch API with inputs)
           v
Beautiful HTML/CSS Polling Page (Returned to User)
           |
           |-- (Client-side script polls `/api/downloads/pdf?token=...&check=true` every 2s)
           |
           v
GitHub Actions Workflow Runner (ubuntu-latest)
           |
           |-- (Installs NodeJS + Puppeteer with full headless Chromium)
           |-- (Executes renderer/generate-pdf.js)
           |-- (Validates request HMAC signature & 15m expiration window)
           |-- (Queries Supabase DB to extract raw resume and template configuration)
           |-- (Compiles styling grid configurations & loads template layout)
           |-- (Generates exact A4 vector PDF. No CDN fallback layout shifts)
           |-- (Uploads output PDF buffer to `resumes` storage bucket)
           |-- (Updates `pdf_generation_jobs` status to 'completed' & generates 24h signed URL)
           v
Vercel API (Redirects User to final signed URL → triggers instant download)
```

---

## 2. Security Mechanisms

To ensure users can never trace or spoof PDF generations:
1. **Hidden Compute**: Users are never exposed to GitHub URLs, Actions run pages, or API tokens. Everything happens server-side from Vercel.
2. **HMAC-SHA256 Payload Signatures**: Requests are signed using `RENDER_SECRET`. The GHA runner recalculates and verifies the signature using the same secret. Unsigned or invalid requests are aborted instantly.
3. **Anti-Replay Window**: Request payloads contain a timestamp. The runner validates that `Math.abs(now - timestamp) <= 15 minutes`.
4. **Disposable Nonce**: Unique nonces are checked to prevent message duplication or runner hijacking.

---

## 3. Database & Storage Configuration

We track rendering states via `public.pdf_generation_jobs`:
- `id` (UUID, Primary Key)
- `user_id` (UUID, owner check)
- `resume_id` (UUID, targeted file)
- `status` (`'pending'`, `'processing'`, `'completed'`, `'failed'`)
- `signature`, `nonce`, `timestamp`
- `pdf_url` (signed URL path)
- `error_message` (logging runner crashes)

The bucket `resumes` is created as a **private** bucket in Supabase. Storage access logs are governed via RLS policies ensuring users can only read their own files.

---

## 4. Environment Keys Checklist

### Vercel Server
- `RENDER_SECRET`: 32+ character random hex key.
- `GITHUB_TOKEN`: GitHub PAT (Personal Access Token) with `repo` scope to fire `workflow_dispatch`.
- `GITHUB_REPO`: Format `owner/repository` (e.g. `pdek1992/ResumeBuilder_deployment`).
- `GITHUB_BRANCH`: Branch name (defaults to `main`).

### GitHub Actions Secrets
- `SUPABASE_URL`: Supabase project URL.
- `SUPABASE_SERVICE_ROLE_KEY`: Service role secret key (bypasses RLS to query resume model and write back completions).
- `RENDER_SECRET`: Matches Vercel's secret for HMAC checks.

---

## 5. Layout & Spacing Tuning

To customize margins and avoid text overlaps:
- Templates are located in `/templates/default/` and loaded dynamically via `file://` protocols inside Puppeteer.
- We declare standard A4 print dimensions (`210mm x 297mm`) with `@page { size: A4; margin: 0; }`.
- Custom font files are loaded **offline** from local directories using `@font-face` inside `style.css` to guarantee zero font shifting.
