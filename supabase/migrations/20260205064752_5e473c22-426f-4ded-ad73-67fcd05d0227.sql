-- Create enum for user actions on AI-generated content
CREATE TYPE ai_user_action AS ENUM ('applied', 'edited', 'rejected', 'regenerated', 'undone');

-- Create table for tracking AI runs and quality signals
CREATE TABLE public.ai_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  storefront_id UUID NOT NULL,
  prompt_raw TEXT NOT NULL,
  intent_json JSONB,
  plan_json JSONB,
  ops_json JSONB,
  validation_errors JSONB DEFAULT '[]'::jsonb,
  failure_tags TEXT[] DEFAULT '{}',
  applied BOOLEAN DEFAULT false,
  user_action ai_user_action,
  diff_summary JSONB,
  latency_ms INTEGER,
  cost_estimate NUMERIC(10, 6),
  repair_attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for analytics queries
CREATE INDEX idx_ai_runs_user_id ON public.ai_runs(user_id);
CREATE INDEX idx_ai_runs_storefront_id ON public.ai_runs(storefront_id);
CREATE INDEX idx_ai_runs_created_at ON public.ai_runs(created_at DESC);
CREATE INDEX idx_ai_runs_user_action ON public.ai_runs(user_action) WHERE user_action IS NOT NULL;
CREATE INDEX idx_ai_runs_failure_tags ON public.ai_runs USING GIN(failure_tags) WHERE array_length(failure_tags, 1) > 0;

-- Enable RLS
ALTER TABLE public.ai_runs ENABLE ROW LEVEL SECURITY;

-- Users can view their own AI runs
CREATE POLICY "Users can view own ai_runs"
ON public.ai_runs FOR SELECT
USING (auth.uid() = user_id);

-- Allow insert from edge functions (service role)
CREATE POLICY "Service role can insert ai_runs"
ON public.ai_runs FOR INSERT
WITH CHECK (true);

-- Users can update their own runs (for user_action tracking)
CREATE POLICY "Users can update own ai_runs"
ON public.ai_runs FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_ai_runs_updated_at
BEFORE UPDATE ON public.ai_runs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();