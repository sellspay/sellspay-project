-- Create nominations table to track user votes
CREATE TABLE public.creator_nominations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL,
  nominator_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(creator_id, nominator_id)
);

-- Enable RLS
ALTER TABLE public.creator_nominations ENABLE ROW LEVEL SECURITY;

-- Anyone can view nomination counts
CREATE POLICY "Anyone can view nominations"
ON public.creator_nominations FOR SELECT
TO anon, authenticated
USING (true);

-- Authenticated users can nominate (but not themselves)
CREATE POLICY "Authenticated users can nominate"
ON public.creator_nominations FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND nominator_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Users can remove their own nomination
CREATE POLICY "Users can remove own nomination"
ON public.creator_nominations FOR DELETE
TO authenticated
USING (
  nominator_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Admins/Owners can delete any nomination
CREATE POLICY "Admins can delete any nomination"
ON public.creator_nominations FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner')
);