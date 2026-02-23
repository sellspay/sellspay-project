-- Add is_starred column to vibecoder_projects for the starred feature
ALTER TABLE public.vibecoder_projects ADD COLUMN IF NOT EXISTS is_starred boolean NOT NULL DEFAULT false;

-- Create index for fast filtering
CREATE INDEX IF NOT EXISTS idx_vibecoder_projects_starred ON public.vibecoder_projects (user_id, is_starred) WHERE is_starred = true;