
-- Phase 1A: Add files jsonb column to vibecoder_projects
ALTER TABLE public.vibecoder_projects 
  ADD COLUMN IF NOT EXISTS files jsonb DEFAULT '{}';

-- Phase 1B: Add files_snapshot jsonb column to vibecoder_messages
ALTER TABLE public.vibecoder_messages 
  ADD COLUMN IF NOT EXISTS files_snapshot jsonb;
