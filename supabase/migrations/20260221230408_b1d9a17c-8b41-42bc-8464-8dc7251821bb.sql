
-- Add validation and attempt tracking columns to ai_generation_jobs
ALTER TABLE public.ai_generation_jobs 
  ADD COLUMN IF NOT EXISTS build_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS intent_check_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS validation_report jsonb,
  ADD COLUMN IF NOT EXISTS terminal_reason text;
