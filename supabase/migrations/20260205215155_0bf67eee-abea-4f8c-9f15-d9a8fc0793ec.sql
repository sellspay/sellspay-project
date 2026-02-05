-- 1. VIBECODER PROJECTS TABLE (The Project Folders)
CREATE TABLE public.vibecoder_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT DEFAULT 'Untitled Project',
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  last_edited_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. VIBECODER MESSAGES TABLE (Chat History & Code Snapshots)
CREATE TABLE public.vibecoder_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.vibecoder_projects(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT,
  code_snapshot TEXT,
  rating INTEGER DEFAULT 0 CHECK (rating IN (-1, 0, 1)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 3. INDEXES FOR PERFORMANCE
CREATE INDEX idx_vibecoder_projects_user_id ON public.vibecoder_projects(user_id);
CREATE INDEX idx_vibecoder_projects_last_edited ON public.vibecoder_projects(last_edited_at DESC);
CREATE INDEX idx_vibecoder_messages_project_id ON public.vibecoder_messages(project_id);
CREATE INDEX idx_vibecoder_messages_created_at ON public.vibecoder_messages(created_at);

-- 4. ENABLE RLS
ALTER TABLE public.vibecoder_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vibecoder_messages ENABLE ROW LEVEL SECURITY;

-- 5. RLS POLICIES FOR PROJECTS
CREATE POLICY "Users can view their own projects"
ON public.vibecoder_projects FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
ON public.vibecoder_projects FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
ON public.vibecoder_projects FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
ON public.vibecoder_projects FOR DELETE
USING (auth.uid() = user_id);

-- 6. RLS POLICIES FOR MESSAGES (via project ownership)
CREATE POLICY "Users can view messages in their projects"
ON public.vibecoder_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.vibecoder_projects
    WHERE id = vibecoder_messages.project_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages in their projects"
ON public.vibecoder_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.vibecoder_projects
    WHERE id = vibecoder_messages.project_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update messages in their projects"
ON public.vibecoder_messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.vibecoder_projects
    WHERE id = vibecoder_messages.project_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete messages in their projects"
ON public.vibecoder_messages FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.vibecoder_projects
    WHERE id = vibecoder_messages.project_id
    AND user_id = auth.uid()
  )
);

-- 7. TRIGGER TO AUTO-UPDATE last_edited_at and updated_at
CREATE TRIGGER update_vibecoder_projects_updated_at
BEFORE UPDATE ON public.vibecoder_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 8. TRIGGER TO UPDATE PROJECT's last_edited_at WHEN MESSAGE IS ADDED
CREATE OR REPLACE FUNCTION public.update_project_last_edited()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.vibecoder_projects
  SET last_edited_at = now()
  WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_project_on_message
AFTER INSERT ON public.vibecoder_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_project_last_edited();