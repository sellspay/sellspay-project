-- Create project_files table for VFS storage (Vibecoder generated code)
CREATE TABLE public.project_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint on profile_id + file_path
CREATE UNIQUE INDEX idx_project_files_profile_path ON public.project_files(profile_id, file_path);

-- Create index for faster lookups by profile
CREATE INDEX idx_project_files_profile ON public.project_files(profile_id);

-- Enable RLS
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can manage their own files
CREATE POLICY "Users can view their own project files"
  ON public.project_files
  FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own project files"
  ON public.project_files
  FOR INSERT
  WITH CHECK (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own project files"
  ON public.project_files
  FOR UPDATE
  USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own project files"
  ON public.project_files
  FOR DELETE
  USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Add trigger to update updated_at
CREATE TRIGGER update_project_files_updated_at
  BEFORE UPDATE ON public.project_files
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add vibecoder_enabled column to ai_storefront_layouts to track mode
ALTER TABLE public.ai_storefront_layouts 
  ADD COLUMN IF NOT EXISTS vibecoder_mode BOOLEAN NOT NULL DEFAULT false;