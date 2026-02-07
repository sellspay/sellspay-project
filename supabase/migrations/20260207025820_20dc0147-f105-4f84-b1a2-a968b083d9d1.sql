-- Add per-project code storage
ALTER TABLE public.project_files
ADD COLUMN IF NOT EXISTS project_id uuid;

-- Link project_files rows to projects (nullable for legacy rows)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'project_files_project_id_fkey'
  ) THEN
    ALTER TABLE public.project_files
    ADD CONSTRAINT project_files_project_id_fkey
    FOREIGN KEY (project_id) REFERENCES public.vibecoder_projects(id)
    ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_project_files_project_id_updated_at
ON public.project_files (project_id, updated_at DESC);

-- Optional: ensure uniqueness per project/file path so upsert is deterministic
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'project_files_project_path_unique'
  ) THEN
    ALTER TABLE public.project_files
    ADD CONSTRAINT project_files_project_path_unique UNIQUE (project_id, file_path);
  END IF;
END $$;

-- RLS stays as-is; this change only adds scoping column.