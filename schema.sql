CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- -----------------------------------------------
-- USERS
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  mobile TEXT,
  password_hash TEXT,
  auth_provider TEXT NOT NULL CHECK (auth_provider IN ('password', 'google')),
  full_name_locked BOOLEAN NOT NULL DEFAULT FALSE,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  consent_given BOOLEAN NOT NULL DEFAULT FALSE,
  consent_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  ai_config JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Compatibility with older deployments where resumes.user_id references profiles(id)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  mobile TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add is_admin if upgrading an existing DB that doesn't have it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE public.users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
END $$;

-- Add ai_config if upgrading an existing DB that doesn't have it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'ai_config'
  ) THEN
    ALTER TABLE public.users ADD COLUMN ai_config JSONB NOT NULL DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- -----------------------------------------------
-- TEMPLATES
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.templates (
  id TEXT PRIMARY KEY,
  template_name TEXT NOT NULL,
  preview_image TEXT NOT NULL,
  config_json JSONB NOT NULL,
  description TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  icon TEXT
);

-- Migration for existing templates table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'templates' AND column_name = 'tags'
  ) THEN
    ALTER TABLE public.templates ADD COLUMN tags TEXT[] NOT NULL DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'templates' AND column_name = 'icon'
  ) THEN
    ALTER TABLE public.templates ADD COLUMN icon TEXT;
  END IF;
END $$;

-- -----------------------------------------------
-- RESUMES
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL REFERENCES public.templates(id),
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  raw_json_compressed TEXT NOT NULL,
  parsed_sections JSONB NOT NULL DEFAULT '{}'::jsonb,
  current_draft_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  ats_score INTEGER,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------
-- RESUME VERSIONS
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.resume_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  version_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------
-- PAYMENTS
-- payment_type: 'resume_download' | 'mock_interview' | 'cover_letter'
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  razorpay_payment_id TEXT UNIQUE,
  order_id TEXT NOT NULL UNIQUE,
  amount NUMERIC(10,2) NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('resume_download', 'mock_interview', 'cover_letter')),
  status TEXT NOT NULL CHECK (status IN ('created', 'paid', 'failed', 'expired', 'refunded')) DEFAULT 'created',
  method TEXT,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- -----------------------------------------------
-- MOCK INTERVIEWS
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.mock_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  jd TEXT NOT NULL,
  qa_data JSONB NOT NULL,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------
-- COVER LETTERS
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.cover_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  jd TEXT NOT NULL,
  generated_text TEXT NOT NULL,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add payment_id column to cover_letters if upgrading
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cover_letters' AND column_name = 'payment_id'
  ) THEN
    ALTER TABLE public.cover_letters ADD COLUMN payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL;
  END IF;
END $$;

-- -----------------------------------------------
-- SUPPORT REQUESTS
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.support_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  autogenerated_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  user_message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------
-- USER ACCESS LOGS
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------
-- USER LAST ACTIVITY
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_last_activity (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------
-- INDEXES
-- -----------------------------------------------
CREATE INDEX IF NOT EXISTS idx_resumes_user_updated ON public.resumes(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_resume_versions_resume ON public.resume_versions(resume_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_user_type_status ON public.payments(user_id, payment_type, status);
CREATE INDEX IF NOT EXISTS idx_payments_expiry ON public.payments(expires_at);
CREATE INDEX IF NOT EXISTS idx_support_requests_user ON public.support_requests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_access_logs_user_action ON public.user_access_logs(user_id, action_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_admin ON public.users(is_admin) WHERE is_admin = TRUE;

-- -----------------------------------------------
-- TRIGGERS
-- -----------------------------------------------
DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_resumes_updated_at ON public.resumes;
CREATE TRIGGER trg_resumes_updated_at
BEFORE UPDATE ON public.resumes
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------
-- NAME LOCK FUNCTION
-- -----------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_locked_name_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.full_name_locked IS TRUE
     AND (NEW.first_name IS DISTINCT FROM OLD.first_name OR NEW.last_name IS DISTINCT FROM OLD.last_name) THEN
    RAISE EXCEPTION 'To change name contact support';
  END IF;

  IF COALESCE(NEW.first_name, '') <> '' AND COALESCE(NEW.last_name, '') <> '' THEN
    NEW.full_name_locked = TRUE;
  END IF;

  RETURN NEW;
END;
$$;

-- -----------------------------------------------
-- AUTOMATIC USER SYNC (AUTH -> PUBLIC)
-- -----------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name, auth_provider)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_app_meta_data->>'provider', 'password')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Note: This trigger requires access to auth schema. 
-- In many Supabase setups, this is safe to include in schema.sql
-- but may require manual execution if the role doesn't have permissions on 'auth'.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Remove restrictive CHECK constraint if it exists to allow social providers
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_auth_provider_check;

DROP TRIGGER IF EXISTS trg_prevent_locked_name_change ON public.users;
CREATE TRIGGER trg_prevent_locked_name_change
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.prevent_locked_name_change();


-- -----------------------------------------------
-- ROW LEVEL SECURITY
-- -----------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Helper function to bypass RLS for admin checks
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT is_admin FROM public.users WHERE id = auth.uid();
$$;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cover_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_last_activity ENABLE ROW LEVEL SECURITY;

-- Users
DROP POLICY IF EXISTS users_select_own ON public.users;
CREATE POLICY users_select_own ON public.users
FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS users_update_own ON public.users;
CREATE POLICY users_update_own ON public.users
FOR UPDATE USING (auth.uid() = id);

-- Admin full-access policy on users
DROP POLICY IF EXISTS users_admin_all ON public.users;
CREATE POLICY users_admin_all ON public.users
FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS profiles_admin_all ON public.profiles;
CREATE POLICY profiles_admin_all ON public.profiles
FOR ALL USING (public.is_admin());

-- Templates
DROP POLICY IF EXISTS templates_read_active ON public.templates;
CREATE POLICY templates_read_active ON public.templates
FOR SELECT USING (active = TRUE);

DROP POLICY IF EXISTS templates_admin_all ON public.templates;
CREATE POLICY templates_admin_all ON public.templates
FOR ALL USING (public.is_admin());

-- Resumes
DROP POLICY IF EXISTS resumes_manage_own ON public.resumes;
CREATE POLICY resumes_manage_own ON public.resumes
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS resumes_admin_all ON public.resumes;
CREATE POLICY resumes_admin_all ON public.resumes
FOR ALL USING (public.is_admin());

-- Resume Versions
DROP POLICY IF EXISTS resume_versions_read_own ON public.resume_versions;
CREATE POLICY resume_versions_read_own ON public.resume_versions
FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM public.resumes
    WHERE public.resumes.id = resume_versions.resume_id
      AND public.resumes.user_id = auth.uid()
  )
);

-- Payments
DROP POLICY IF EXISTS payments_read_own ON public.payments;
CREATE POLICY payments_read_own ON public.payments
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS payments_admin_all ON public.payments;
CREATE POLICY payments_admin_all ON public.payments
FOR ALL USING (public.is_admin());

-- Mock Interviews
DROP POLICY IF EXISTS mock_interviews_manage_own ON public.mock_interviews;
CREATE POLICY mock_interviews_manage_own ON public.mock_interviews
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Cover Letters
DROP POLICY IF EXISTS cover_letters_manage_own ON public.cover_letters;
CREATE POLICY cover_letters_manage_own ON public.cover_letters
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Support Requests
DROP POLICY IF EXISTS support_requests_manage_own ON public.support_requests;
CREATE POLICY support_requests_manage_own ON public.support_requests
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Access Logs
DROP POLICY IF EXISTS access_logs_read_own ON public.user_access_logs;
CREATE POLICY access_logs_read_own ON public.user_access_logs
FOR SELECT USING (auth.uid() = user_id);

-- Last Activity
DROP POLICY IF EXISTS last_activity_manage_own ON public.user_last_activity;
CREATE POLICY last_activity_manage_own ON public.user_last_activity
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- -----------------------------------------------
-- TEMPLATE SEED DATA (idempotent upsert)
-- -----------------------------------------------
INSERT INTO public.templates (id, template_name, preview_image, config_json, description, tags, active, icon) VALUES
  ('elite-modular-card', 'Elite Modular Card', '/templates/elite-modular-card.png', '{"accent":"#2563eb","headerBackground":"#f8fafc","pageBackground":"#ffffff","density":"balanced","typography":"modern-sans","columns":"single","layout":"modular-card"}', 'Premium modular card-based layout for a modern interactive look.', ARRAY['Elite', 'Modular', 'Premium'], TRUE, '/icons/icon-resume.png'),
  ('elite-sidebar-circles', 'Elite Sidebar Circles', '/templates/elite-sidebar-circles.png', '{"accent":"#0284c7","headerBackground":"#ffffff","pageBackground":"#ffffff","density":"balanced","typography":"modern-sans","columns":"split","layout":"sidebar-circles"}', 'Clean sidebar layout with circular indicators and elegant hierarchy.', ARRAY['Elite', 'Sidebar', 'Visual'], TRUE, '/icons/icon-connections.png'),
  ('elite-banner-soft', 'Elite Soft Banner', '/templates/elite-banner-soft.png', '{"accent":"#65a30d","headerBackground":"#ecfccb","pageBackground":"#ffffff","density":"airy","typography":"modern-sans","columns":"split","layout":"banner-soft"}', 'Sophisticated layout with a soft banner and clean two-column content.', ARRAY['Elite', 'Banner', 'Professional'], TRUE, '/icons/icon-communication.png'),
  ('elite-grid-labels', 'Elite Grid Labels', '/templates/elite-grid-labels.png', '{"accent":"#1e293b","headerBackground":"#ffffff","pageBackground":"#ffffff","density":"compact","typography":"editorial-serif","columns":"single","layout":"grid-labels"}', 'Structured grid-based layout with prominent section labels.', ARRAY['Elite', 'Grid', 'Modern'], TRUE, '/icons/icon-target.png'),
  ('elite-sidebar-dark', 'Elite Dark Sidebar', '/templates/elite-sidebar-dark.png', '{"accent":"#14532d","headerBackground":"#ffffff","pageBackground":"#ffffff","sidebarTint":"#14532d","density":"balanced","typography":"modern-sans","columns":"split","layout":"sidebar-dark"}', 'Professional layout with a bold dark sidebar for high contrast.', ARRAY['Elite', 'Sidebar', 'Bold'], TRUE, '/icons/icon-resume.png'),
  ('elite-corporate-pro', 'Elite Corporate Pro', '/templates/elite-corporate-pro.png', '{"accent":"#0f172a","headerBackground":"#f1f5f9","pageBackground":"#ffffff","density":"balanced","typography":"modern-sans","columns":"single","layout":"standard"}', 'A high-end corporate layout with refined spacing and strong hierarchy.', ARRAY['Elite', 'Corporate', 'High-End'], TRUE, '/icons/icon-analytics.png'),
  ('elite-creative-bold', 'Elite Creative Bold', '/templates/elite-creative-bold.png', '{"accent":"#7e22ce","headerBackground":"#faf5ff","pageBackground":"#ffffff","density":"airy","typography":"editorial-serif","columns":"split","layout":"standard"}', 'Dynamic and expressive layout for creative professionals.', ARRAY['Elite', 'Creative', 'Bold'], TRUE, '/icons/icon-ai-brain.png'),
  ('elite-dynamic-grid', 'Elite Dynamic Grid', '/templates/elite-dynamic-grid.png', '{"accent":"#0369a1","headerBackground":"#ffffff","pageBackground":"#ffffff","density":"compact","typography":"modern-sans","columns":"single","layout":"grid-labels"}', 'Modern grid-based system for high-impact visual presentation.', ARRAY['Elite', 'Grid', 'Dynamic'], TRUE, '/icons/icon-github-ai.png'),
  ('elite-elegant-serif', 'Elite Elegant Serif', '/templates/elite-elegant-serif.png', '{"accent":"#4338ca","headerBackground":"#eef2ff","pageBackground":"#ffffff","density":"airy","typography":"editorial-serif","columns":"single","layout":"standard"}', 'Timeless elegance with a focus on typography and whitespace.', ARRAY['Elite', 'Elegant', 'Classic'], TRUE, '/icons/icon-resume.png'),
  ('elite-minimal-clean', 'Elite Minimal Clean', '/templates/elite-minimal-clean.png', '{"accent":"#374151","headerBackground":"#ffffff","pageBackground":"#ffffff","density":"balanced","typography":"modern-sans","columns":"single","layout":"standard"}', 'Ultra-clean minimalist layout for a distraction-free experience.', ARRAY['Elite', 'Minimal', 'Clean'], TRUE, '/icons/icon-upload.png'),
  ('elite-modern-accent', 'Elite Modern Accent', '/templates/elite-modern-accent.png', '{"accent":"#be185d","headerBackground":"#fdf2f8","pageBackground":"#ffffff","density":"balanced","typography":"modern-sans","columns":"split","layout":"standard"}', 'Contemporary layout with bold accent elements and modern feel.', ARRAY['Elite', 'Modern', 'Accent'], TRUE, '/icons/icon-target.png'),
  ('elite-premium-executive', 'Elite Premium Executive', '/templates/elite-premium-executive.png', '{"accent":"#1e1b4b","headerBackground":"#e0e7ff","pageBackground":"#ffffff","density":"airy","typography":"editorial-serif","columns":"single","layout":"standard"}', 'The ultimate executive template for C-suite and senior leaders.', ARRAY['Elite', 'Executive', 'Premium'], TRUE, '/icons/icon-resume.png'),
  ('elite-sharp-modern', 'Elite Sharp Modern', '/templates/elite-sharp-modern.png', '{"accent":"#15803d","headerBackground":"#f0fdf4","pageBackground":"#ffffff","density":"compact","typography":"technical-mono","columns":"single","layout":"standard"}', 'Precise, sharp layout with clear lines and professional impact.', ARRAY['Elite', 'Sharp', 'Modern'], TRUE, '/icons/icon-github-ai.png'),
  ('elite-soft-minimal', 'Elite Soft Minimal', '/templates/elite-soft-minimal.png', '{"accent":"#0891b2","headerBackground":"#ecfeff","pageBackground":"#ffffff","density":"balanced","typography":"modern-sans","columns":"single","layout":"standard"}', 'Gentle minimalist approach with soft colors and clean layout.', ARRAY['Elite', 'Minimal', 'Soft'], TRUE, '/icons/icon-communication.png'),
  ('elite-bold-header', 'Elite Bold Header', '/templates/elite-bold-header.png', '{"accent":"#b91c1c","headerBackground":"#fef2f2","pageBackground":"#ffffff","density":"balanced","typography":"modern-sans","columns":"single","layout":"standard"}', 'Command attention with a bold header and structured content flow.', ARRAY['Elite', 'Bold', 'Impactful'], TRUE, '/icons/icon-target.png'),
  ('minimal-ats', 'ATS Minimal', '/templates/minimal-ats.png', '{"accent":"#0f6c7c","headerBackground":"#0f6c7c","pageBackground":"#ffffff","sidebarTint":"#f8fafc","density":"balanced","typography":"modern-sans","columns":"split"}', 'Clean ATS-safe layout with a strong recruiter scan path.', ARRAY['ATS', 'Minimal', 'Professional'], TRUE, NULL),
  ('modern-professional', 'Modern Professional', '/templates/modern-professional.png', '{"accent":"#334155","headerBackground":"#ffffff","pageBackground":"#ffffff","sidebarTint":"#f8fafc","density":"balanced","typography":"modern-sans","columns":"split"}', 'Professional layout with elegant hierarchy for corporate roles.', ARRAY['Modern', 'Professional', 'Corporate'], TRUE, NULL),
  ('executive', 'Executive', '/templates/executive.png', '{"accent":"#1d4ed8","headerBackground":"#eff6ff","pageBackground":"#ffffff","sidebarTint":"#eef2ff","density":"airy","typography":"editorial-serif","columns":"single"}', 'Premium executive profile with crisp spacing and clear hierarchy.', ARRAY['Executive', 'Premium', 'Classic'], TRUE, NULL),
  ('hybrid', 'Hybrid', '/templates/hybrid.png', '{"accent":"#0f766e","headerBackground":"#ffffff","pageBackground":"#ffffff","sidebarTint":"#f0fdfa","density":"balanced","typography":"modern-sans","columns":"split"}', 'Balanced hybrid resume for experienced candidates.', ARRAY['Hybrid', 'Experienced', 'Balanced'], TRUE, NULL),
  ('creative', 'Creative', '/templates/creative.png', '{"accent":"#7c3aed","headerBackground":"#f5f3ff","pageBackground":"#ffffff","sidebarTint":"#faf5ff","density":"balanced","typography":"editorial-serif","columns":"split"}', 'Contemporary layout with stronger visual character.', ARRAY['Creative', 'Visual', 'Contemporary'], TRUE, NULL),
  ('modern-columns', 'Modern Columns', '/templates/modern-columns.png', '{"accent":"#2563eb","headerBackground":"#eff6ff","pageBackground":"#ffffff","sidebarTint":"#f8fafc","density":"compact","typography":"modern-sans","columns":"split"}', 'Structured dual-column layout with concise scannability.', ARRAY['Modern', 'Columns', 'Scannable'], TRUE, NULL),
  ('sleek-dark', 'Sleek Dark', '/templates/sleek-dark.png', '{"accent":"#111827","headerBackground":"#111827","pageBackground":"#ffffff","sidebarTint":"#f8fafc","density":"balanced","typography":"modern-sans","columns":"single"}', 'Dark-accent premium layout for standout senior applications.', ARRAY['Sleek', 'Dark', 'Premium'], TRUE, NULL),
  ('luxury-gold', 'Luxury Gold', '/templates/luxury-gold.png', '{"accent":"#a16207","headerBackground":"#fffbeb","pageBackground":"#ffffff","sidebarTint":"#fefce8","density":"airy","typography":"editorial-serif","columns":"single"}', 'Reserved luxury styling with refined color contrast.', ARRAY['Luxury', 'Gold', 'Refined'], TRUE, NULL),
  ('impactful', 'Impactful', '/templates/impactful.png', '{"accent":"#dc2626","headerBackground":"#fef2f2","pageBackground":"#ffffff","sidebarTint":"#fff7ed","density":"compact","typography":"modern-sans","columns":"single"}', 'Bold recruiter-facing layout optimized for quantified accomplishments.', ARRAY['Impactful', 'Bold', 'Achievements'], TRUE, NULL),
  ('infographic', 'Infographic', '/templates/infographic.png', '{"accent":"#9333ea","headerBackground":"#faf5ff","pageBackground":"#ffffff","sidebarTint":"#fdf4ff","density":"balanced","typography":"modern-sans","columns":"split"}', 'Graphic-leaning presentation with controlled flair.', ARRAY['Infographic', 'Creative', 'Visual'], TRUE, NULL),
  ('startup', 'Startup', '/templates/startup.png', '{"accent":"#ea580c","headerBackground":"#fff7ed","pageBackground":"#ffffff","sidebarTint":"#fffbeb","density":"compact","typography":"modern-sans","columns":"split"}', 'Fast-moving startup style with metrics emphasis.', ARRAY['Startup', 'Metrics', 'Fast'], TRUE, NULL),
  ('classic-academic', 'Classic Academic', '/templates/classic-academic.png', '{"accent":"#1e3a8a","headerBackground":"#eff6ff","pageBackground":"#ffffff","sidebarTint":"#ffffff","density":"airy","typography":"editorial-serif","columns":"single"}', 'Traditional academic format with disciplined hierarchy.', ARRAY['Academic', 'Classic', 'Traditional'], TRUE, NULL),
  ('ultra-minimalist', 'Ultra Minimalist', '/templates/ultra-minimalist.png', '{"accent":"#475569","headerBackground":"#ffffff","pageBackground":"#ffffff","sidebarTint":"#ffffff","density":"airy","typography":"modern-sans","columns":"single"}', 'Quiet minimalist design for conservative hiring funnels.', ARRAY['Minimalist', 'Clean', 'Conservative'], TRUE, NULL),
  ('creative-designer', 'Creative Designer', '/templates/creative-designer.png', '{"accent":"#0d9488","headerBackground":"#ecfeff","pageBackground":"#ffffff","sidebarTint":"#f0fdfa","density":"balanced","typography":"editorial-serif","columns":"split"}', 'A more expressive visual system for design-forward candidates.', ARRAY['Designer', 'Creative', 'Visual'], TRUE, NULL),
  ('deep-charcoal', 'Deep Charcoal', '/templates/deep-charcoal.png', '{"accent":"#0f172a","headerBackground":"#e2e8f0","pageBackground":"#ffffff","sidebarTint":"#f8fafc","density":"balanced","typography":"modern-sans","columns":"single"}', 'Serious and understated with deep neutral contrast.', ARRAY['Serious', 'Contrast', 'Neutral'], TRUE, NULL),
  ('corporate-minimal', 'Corporate Minimal', '/templates/corporate-minimal.png', '{"accent":"#2563eb","headerBackground":"#ffffff","pageBackground":"#ffffff","sidebarTint":"#f8fafc","density":"balanced","typography":"modern-sans","columns":"single"}', 'Corporate-safe format with modern whitespace.', ARRAY['Corporate', 'Minimal', 'Safe'], TRUE, NULL),
  ('pastel-professional', 'Pastel Professional', '/templates/pastel-professional.png', '{"accent":"#7c3aed","headerBackground":"#faf5ff","pageBackground":"#ffffff","sidebarTint":"#fdf4ff","density":"airy","typography":"editorial-serif","columns":"single"}', 'Soft but polished styling for people-facing roles.', ARRAY['Pastel', 'Soft', 'Professional'], TRUE, NULL),
  ('vibrant-startup', 'Vibrant Startup', '/templates/vibrant-startup.png', '{"accent":"#db2777","headerBackground":"#fdf2f8","pageBackground":"#ffffff","sidebarTint":"#fff1f2","density":"compact","typography":"modern-sans","columns":"split"}', 'High-energy startup template with colorful section anchors.', ARRAY['Vibrant', 'Startup', 'Color'], TRUE, NULL)
ON CONFLICT (id) DO UPDATE SET
  template_name = EXCLUDED.template_name,
  preview_image = EXCLUDED.preview_image,
  config_json = EXCLUDED.config_json,
  description = EXCLUDED.description,
  tags = EXCLUDED.tags,
  active = EXCLUDED.active,
  icon = EXCLUDED.icon;

-- -----------------------------------------------
-- ADMIN USER SEED (idempotent)
-- Login email: pdek@vigilsiddhi.com
-- Password:    Pdek%1991
-- Username:    pdek (maps to email above)
-- -----------------------------------------------
DO $$
DECLARE
  v_admin_uid  UUID;
  v_existing   UUID;
BEGIN
  -- Look for existing auth user by email
  SELECT id INTO v_existing
    FROM auth.users
   WHERE email = 'pdek@vigilsiddhi.com'
   LIMIT 1;

  IF v_existing IS NULL THEN
    -- Generate a stable UUID for the admin
    v_admin_uid := gen_random_uuid();

    -- Create Supabase auth user (GoTrue-compatible bcrypt password)
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    ) VALUES (
      v_admin_uid,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'pdek@vigilsiddhi.com',
      crypt('Pdek%1991', gen_salt('bf', 10)),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Admin","username":"pdek"}'::jsonb,
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );

    -- Create matching public profile with admin flag
    INSERT INTO public.users (
      id, email, auth_provider,
      first_name, last_name,
      is_admin,
      consent_given, consent_timestamp
    ) VALUES (
      v_admin_uid,
      'pdek@vigilsiddhi.com',
      'password',
      'Admin', 'User',
      TRUE,
      TRUE, NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'Admin user created — email: pdek@vigilsiddhi.com, password: Pdek%%1991';
  ELSE
    -- Admin exists — refresh password and ensure admin flag
    UPDATE auth.users
       SET encrypted_password = crypt('Pdek%1991', gen_salt('bf', 10)),
           updated_at = NOW()
     WHERE id = v_existing;

    INSERT INTO public.users (
      id, email, auth_provider,
      first_name, last_name,
      is_admin,
      consent_given, consent_timestamp
    ) VALUES (
      v_existing,
      'pdek@vigilsiddhi.com',
      'password',
      'Admin', 'User',
      TRUE,
      TRUE, NOW()
    )
    ON CONFLICT (id) DO UPDATE SET is_admin = TRUE;

    RAISE NOTICE 'Admin user already exists — password reset, is_admin ensured.';
  END IF;
END $$;

-- -----------------------------------------------
-- SEED DATA: TEMPLATES
-- -----------------------------------------------
INSERT INTO public.templates (id, template_name, preview_image, description, tags, config_json, active)
VALUES 
('minimal-ats', 'ATS Minimal', '/templates/minimal-ats.png', 'Clean ATS-safe layout with a strong recruiter scan path.', ARRAY['ATS', 'Minimal', 'Professional'], '{"accent": "#0f6c7c", "headerBackground": "#0f6c7c", "pageBackground": "#ffffff", "sidebarTint": "#f8fafc", "density": "balanced", "typography": "modern-sans", "columns": "split"}'::jsonb, true),
('modern-professional', 'Modern Professional', '/templates/modern-professional.png', 'Professional layout with elegant hierarchy for general corporate roles.', ARRAY['Modern', 'Professional', 'Corporate'], '{"accent": "#334155", "headerBackground": "#ffffff", "pageBackground": "#ffffff", "sidebarTint": "#f8fafc", "density": "balanced", "typography": "modern-sans", "columns": "split"}'::jsonb, true),
('executive', 'Executive', '/templates/executive.png', 'Premium executive profile with crisp spacing and decisive section rhythm.', ARRAY['Executive', 'Premium', 'Classic'], '{"accent": "#1d4ed8", "headerBackground": "#eff6ff", "pageBackground": "#ffffff", "sidebarTint": "#eef2ff", "density": "airy", "typography": "editorial-serif", "columns": "single"}'::jsonb, true)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------
-- MIGRATIONS / PATCHES
-- -----------------------------------------------

-- Add missing columns to resumes table if they don't exist
DO $$
BEGIN
    -- template_id
    -- title
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'resumes' AND column_name = 'title') THEN
        ALTER TABLE public.resumes ADD COLUMN title TEXT NOT NULL DEFAULT 'Untitled Resume';
    END IF;

    -- template_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'resumes' AND column_name = 'template_id') THEN
        ALTER TABLE public.resumes ADD COLUMN template_id TEXT;
        ALTER TABLE public.resumes ADD CONSTRAINT resumes_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.templates(id);
    END IF;

    -- raw_json_compressed
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'resumes' AND column_name = 'raw_json_compressed') THEN
        ALTER TABLE public.resumes ADD COLUMN raw_json_compressed TEXT;
    END IF;

    -- content (legacy deployments require this column)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'resumes' AND column_name = 'content') THEN
        ALTER TABLE public.resumes ADD COLUMN content JSONB NOT NULL DEFAULT '{}'::jsonb;
    END IF;

    -- ats_score
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'resumes' AND column_name = 'ats_score') THEN
        ALTER TABLE public.resumes ADD COLUMN ats_score INTEGER;
    END IF;
    
    -- parsed_sections
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'resumes' AND column_name = 'parsed_sections') THEN
        ALTER TABLE public.resumes ADD COLUMN parsed_sections JSONB NOT NULL DEFAULT '{}'::jsonb;
    END IF;
    
    -- current_draft_state
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'resumes' AND column_name = 'current_draft_state') THEN
        ALTER TABLE public.resumes ADD COLUMN current_draft_state JSONB NOT NULL DEFAULT '{}'::jsonb;
    END IF;
    
    -- user_id foreign key check
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'resumes_user_id_fkey' AND table_name = 'resumes') THEN
        ALTER TABLE public.resumes ADD CONSTRAINT resumes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;

    -- is_locked
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'resumes' AND column_name = 'is_locked') THEN
        ALTER TABLE public.resumes ADD COLUMN is_locked BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
END $$;

-- FORCE SCHEMA RELOAD
NOTIFY pgrst, 'reload schema';
