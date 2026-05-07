# Deployment Guide

## 1. Supabase Setup

1. Create a new Supabase project.
2. Disable mandatory email confirmation if you want direct password signup.
3. Run the SQL in [schema.sql](./schema.sql).
4. Create any optional storage buckets you want for profile photos or imported files.
5. Copy:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

## 2. Environment Variables

Create `.env.local` or configure Vercel project envs using `.env.example`.

Required groups:
- Supabase
- Razorpay
- Gemini/OpenAI key pools
- Telegram
- `JWT_SECRET`
- `SESSION_SECRET`
- `CRON_SECRET`
- `NEXT_PUBLIC_APP_URL`

## 3. Razorpay Setup

1. Create API keys in Razorpay dashboard.
2. Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
3. Use test mode first.
4. Verify server-side signature validation with `/api/payments/verify`.

## 4. Telegram Bot Setup

1. Create a bot with BotFather.
2. Capture the bot token.
3. Add the bot to your destination chat or group.
4. Get the target chat ID.
5. Set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`.

## 5. Vercel Deployment

1. Import the repository into Vercel.
2. Set framework preset to Next.js.
3. Add all env variables.
4. Deploy once.
5. Confirm `npm run build` passes in Vercel logs.

## 6. Domain Setup

1. Add your custom domain in Vercel.
2. Point DNS records as instructed by Vercel.
3. Update `NEXT_PUBLIC_APP_URL` to the final production origin.
4. Redeploy after origin changes.

## 7. Post-Deploy Validation

- Sign up with password
- Sign in with Google
- Confirm name lock behavior
- Import a PDF and create a manual draft
- Switch templates and verify autosave
- Run AI summary generation
- Create a Razorpay order
- Verify payment success and failure handling
- Generate PDF and DOCX via signed URLs
- Generate cover letter after resume access payment
- Buy and consume a mock interview payment
- Submit a support request
- Delete an account and confirm payment rows remain
- Confirm Telegram alerts arrive for signup, login, payment, export, and AI generation

## 8. Production Checklist

- Rotate any previously exposed local secrets
- Enable HTTPS-only production deployment
- Verify Supabase RLS policies
- Verify CSP does not block checkout or Supabase auth
- Confirm cron route secret is set
- Confirm export pass expiry works
- Confirm no API keys appear in browser bundles
- Confirm support email and WhatsApp number are correct
