
-- Create intent profile table for tracking per-project intent over time
CREATE TABLE public.vibecoder_intent_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.vibecoder_projects(id) ON DELETE CASCADE,
  primary_intent TEXT NOT NULL DEFAULT 'other',
  feature_counts JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_project_intent UNIQUE (project_id)
);

-- Enable RLS
ALTER TABLE public.vibecoder_intent_profiles ENABLE ROW LEVEL SECURITY;

-- RLS: Users can only access their own project intent profiles
CREATE POLICY "Users can view their own intent profiles"
ON public.vibecoder_intent_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.vibecoder_projects vp
    WHERE vp.id = vibecoder_intent_profiles.project_id
    AND vp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own intent profiles"
ON public.vibecoder_intent_profiles
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.vibecoder_projects vp
    WHERE vp.id = vibecoder_intent_profiles.project_id
    AND vp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own intent profiles"
ON public.vibecoder_intent_profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.vibecoder_projects vp
    WHERE vp.id = vibecoder_intent_profiles.project_id
    AND vp.user_id = auth.uid()
  )
);

-- Auto-update timestamp trigger
CREATE TRIGGER update_intent_profiles_updated_at
BEFORE UPDATE ON public.vibecoder_intent_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
