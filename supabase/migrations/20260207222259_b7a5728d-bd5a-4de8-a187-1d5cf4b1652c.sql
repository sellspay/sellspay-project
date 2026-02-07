-- Create AI generation jobs table for background-persistent processing
CREATE TABLE public.ai_generation_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.vibecoder_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  prompt TEXT NOT NULL,
  ai_prompt TEXT, -- The full prompt sent to AI (may include system instructions)
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  code_result TEXT, -- The generated code (if successful)
  summary TEXT, -- AI's natural language response
  plan_result JSONB, -- If this was a plan request, the plan JSON
  error_message TEXT, -- Error message if failed
  model_id TEXT, -- Which AI model was used
  is_plan_mode BOOLEAN DEFAULT false,
  progress_logs TEXT[] DEFAULT '{}', -- Array of progress log messages
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_generation_jobs ENABLE ROW LEVEL SECURITY;

-- Users can only see/manage their own jobs
CREATE POLICY "Users can view own jobs"
  ON public.ai_generation_jobs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jobs"
  ON public.ai_generation_jobs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jobs"
  ON public.ai_generation_jobs
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own jobs"
  ON public.ai_generation_jobs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast lookups by project
CREATE INDEX idx_ai_generation_jobs_project ON public.ai_generation_jobs(project_id);
CREATE INDEX idx_ai_generation_jobs_user_status ON public.ai_generation_jobs(user_id, status);

-- Trigger to update updated_at
CREATE TRIGGER update_ai_generation_jobs_updated_at
  BEFORE UPDATE ON public.ai_generation_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for this table so clients can subscribe to changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_generation_jobs;