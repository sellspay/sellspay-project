
-- Add last_valid_files column to store the persistent stable snapshot
ALTER TABLE public.vibecoder_projects 
ADD COLUMN IF NOT EXISTS last_valid_files jsonb DEFAULT NULL;

-- Add a comment for documentation
COMMENT ON COLUMN public.vibecoder_projects.last_valid_files IS 'Last validated+compiled files snapshot. Used as rollback target on failure. Only updated after guardrails pass AND preview confirms success.';
