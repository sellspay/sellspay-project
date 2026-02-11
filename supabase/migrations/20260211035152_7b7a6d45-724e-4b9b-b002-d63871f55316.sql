
-- Campaign runs: tracks execution of a campaign template
CREATE TABLE public.campaign_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  template_id UUID NOT NULL REFERENCES public.campaign_templates(id),
  product_id UUID NULL,
  product_context JSONB NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  current_step_index INT NOT NULL DEFAULT 0,
  steps_state JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_credits_used INT NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NULL,
  completed_at TIMESTAMPTZ NULL,
  error_message TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaign_runs ENABLE ROW LEVEL SECURITY;

-- Policies: users can only access their own runs
CREATE POLICY "Users can view their own campaign runs"
  ON public.campaign_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own campaign runs"
  ON public.campaign_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaign runs"
  ON public.campaign_runs FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_campaign_runs_updated_at
  BEFORE UPDATE ON public.campaign_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for live progress updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_runs;
