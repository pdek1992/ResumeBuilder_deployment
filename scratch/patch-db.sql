-- Ensure all required columns exist in the resumes table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'resumes' AND column_name = 'ats_score') THEN
        ALTER TABLE public.resumes ADD COLUMN ats_score INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'resumes' AND column_name = 'parsed_sections') THEN
        ALTER TABLE public.resumes ADD COLUMN parsed_sections JSONB NOT NULL DEFAULT '{}'::jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'resumes' AND column_name = 'current_draft_state') THEN
        ALTER TABLE public.resumes ADD COLUMN current_draft_state JSONB NOT NULL DEFAULT '{}'::jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'resumes' AND column_name = 'is_locked') THEN
        ALTER TABLE public.resumes ADD COLUMN is_locked BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
END $$;

-- Also check for templates table and seed default if needed
-- (Though seeding is better done via script, we can ensure the table exists)
CREATE TABLE IF NOT EXISTS public.templates (
  id TEXT PRIMARY KEY,
  template_name TEXT NOT NULL,
  preview_image TEXT NOT NULL,
  config_json JSONB NOT NULL,
  description TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT TRUE
);
