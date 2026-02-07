-- Add is_broken flag and last_success_at timestamp to vibecoder_projects
ALTER TABLE vibecoder_projects 
ADD COLUMN IF NOT EXISTS is_broken BOOLEAN DEFAULT FALSE;

ALTER TABLE vibecoder_projects 
ADD COLUMN IF NOT EXISTS last_success_at TIMESTAMPTZ;

-- Add index for faster lookups on broken projects
CREATE INDEX IF NOT EXISTS idx_vibecoder_projects_is_broken 
ON vibecoder_projects(is_broken) 
WHERE is_broken = TRUE;

-- Comment for documentation
COMMENT ON COLUMN vibecoder_projects.is_broken IS 'Tracks if the project is in a broken state. Set to FALSE when a build succeeds.';
COMMENT ON COLUMN vibecoder_projects.last_success_at IS 'Timestamp of the last successful build/render.';