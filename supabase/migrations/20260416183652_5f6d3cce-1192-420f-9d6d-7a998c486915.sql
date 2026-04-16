ALTER TABLE public.ai_generation_jobs
  ADD COLUMN IF NOT EXISTS last_heartbeat_at timestamptz,
  ADD COLUMN IF NOT EXISTS failure_stage text,
  ADD COLUMN IF NOT EXISTS files_changed_count integer;

CREATE INDEX IF NOT EXISTS idx_ai_generation_jobs_heartbeat
  ON public.ai_generation_jobs(last_heartbeat_at)
  WHERE status IN ('pending', 'running');