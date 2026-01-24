-- New table for platform updates
CREATE TABLE public.platform_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'announcement',
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.platform_updates ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view updates"
ON public.platform_updates FOR SELECT
TO anon, authenticated
USING (true);

-- Owner-only write access (uses has_role function)
CREATE POLICY "Only owner can create updates"
ON public.platform_updates FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'owner')
);

CREATE POLICY "Only owner can update updates"
ON public.platform_updates FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Only owner can delete updates"
ON public.platform_updates FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'owner'));

-- Add trigger for updated_at
CREATE TRIGGER update_platform_updates_updated_at
BEFORE UPDATE ON public.platform_updates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_updates;