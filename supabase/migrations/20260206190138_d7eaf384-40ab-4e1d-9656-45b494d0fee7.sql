-- Add versioning fields to platform_updates table
ALTER TABLE platform_updates
ADD COLUMN IF NOT EXISTS version_number text,
ADD COLUMN IF NOT EXISTS version_type text,
ADD COLUMN IF NOT EXISTS media_url text,
ADD COLUMN IF NOT EXISTS media_type text,
ADD COLUMN IF NOT EXISTS discord_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS feature_tags text[];

-- Add check constraints
ALTER TABLE platform_updates
ADD CONSTRAINT check_version_type CHECK (version_type IS NULL OR version_type IN ('major', 'minor', 'patch')),
ADD CONSTRAINT check_media_type CHECK (media_type IS NULL OR media_type IN ('image', 'gif', 'video'));

-- Create vibecoder_heal_logs table for tracking AI self-healing stats
CREATE TABLE public.vibecoder_heal_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.vibecoder_projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  error_type text NOT NULL,
  error_message text,
  healing_source text CHECK (healing_source IN ('orchestrator', 'frontend')),
  success boolean DEFAULT false,
  attempts integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on heal_logs
ALTER TABLE public.vibecoder_heal_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own heal logs
CREATE POLICY "Users can view own heal logs"
ON public.vibecoder_heal_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own heal logs
CREATE POLICY "Users can insert own heal logs"
ON public.vibecoder_heal_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create index for efficient querying
CREATE INDEX idx_heal_logs_user_id ON public.vibecoder_heal_logs(user_id);
CREATE INDEX idx_heal_logs_project_id ON public.vibecoder_heal_logs(project_id);
CREATE INDEX idx_heal_logs_created_at ON public.vibecoder_heal_logs(created_at DESC);