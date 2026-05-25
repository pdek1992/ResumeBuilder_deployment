-- Migration Name: 20260525_secure_pdf_pipeline.sql
-- Description: Sets up pdf_generation_jobs table for secure GHA tracking

-- -------------------------------------------------------------
-- PDF GENERATION JOBS TABLE
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pdf_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  signature TEXT NOT NULL,
  nonce TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  pdf_url TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing for high-performance polling
CREATE INDEX IF NOT EXISTS idx_pdf_generation_jobs_user_status ON public.pdf_generation_jobs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_pdf_generation_jobs_updated ON public.pdf_generation_jobs(updated_at DESC);

-- Trigger for auto updated_at
DROP TRIGGER IF EXISTS trg_pdf_generation_jobs_updated_at ON public.pdf_generation_jobs;
CREATE TRIGGER trg_pdf_generation_jobs_updated_at
BEFORE UPDATE ON public.pdf_generation_jobs
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- -------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- -------------------------------------------------------------
ALTER TABLE public.pdf_generation_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pdf_generation_jobs_manage_own ON public.pdf_generation_jobs;
CREATE POLICY pdf_generation_jobs_manage_own ON public.pdf_generation_jobs
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS pdf_generation_jobs_admin_all ON public.pdf_generation_jobs;
CREATE POLICY pdf_generation_jobs_admin_all ON public.pdf_generation_jobs
FOR ALL USING (public.is_admin());

-- -------------------------------------------------------------
-- STORAGE BUCKET INITIALIZATION (Idempotent seed helper)
-- -------------------------------------------------------------
-- Note: Direct insertion into storage.buckets is standard in console migrations
-- to ensure the 'resumes' bucket exists.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'storage' AND tablename = 'buckets') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'resumes', 
      'resumes', 
      FALSE, -- Private bucket
      10485760, -- 10MB limit
      ARRAY['application/pdf']
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- RLS policies for storage objects if the storage schema is active
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'storage' AND tablename = 'objects') THEN
    -- Policy for authenticated users to select their own files from storage
    DROP POLICY IF EXISTS "Users can read own resume PDFs" ON storage.objects;

    CREATE POLICY "Users can read own resume PDFs" ON storage.objects
    FOR SELECT TO authenticated
    USING (
      bucket_id = 'resumes'
      AND (
        owner = auth.uid()
        OR public.is_admin()
      )
    );

    -- Policy for service-role (or GHA runner) to upload/update/delete any file
    -- Note: Service-role automatically bypasses RLS policies in Supabase, 
    -- but adding explicit policies ensures fallback permissions.
  END IF;
END $$;

-- FORCE SCHEMA RELOAD
NOTIFY pgrst, 'reload schema';