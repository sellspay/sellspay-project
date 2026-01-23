-- Create comment_likes table for tracking likes on comments
CREATE TABLE public.comment_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Enable RLS on comment_likes
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for comment_likes
CREATE POLICY "Anyone can view comment likes"
ON public.comment_likes FOR SELECT
USING (true);

CREATE POLICY "Users can like comments"
ON public.comment_likes FOR INSERT
WITH CHECK (user_id IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Users can unlike comments"
ON public.comment_likes FOR DELETE
USING (user_id IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()));

-- Add parent_comment_id for reply threading and gif_url for GIPHY support
ALTER TABLE public.comments 
ADD COLUMN parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
ADD COLUMN gif_url TEXT;