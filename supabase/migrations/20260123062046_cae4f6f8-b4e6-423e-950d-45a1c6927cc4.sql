-- Create followers table for creator follow system
CREATE TABLE public.followers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Add foreign key constraints
ALTER TABLE public.followers 
  ADD CONSTRAINT followers_follower_id_fkey 
  FOREIGN KEY (follower_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.followers 
  ADD CONSTRAINT followers_following_id_fkey 
  FOREIGN KEY (following_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- Everyone can see follower counts (for public profiles)
CREATE POLICY "Anyone can view followers"
  ON public.followers
  FOR SELECT
  USING (true);

-- Users can follow/unfollow (insert their own follows)
CREATE POLICY "Users can follow others"
  ON public.followers
  FOR INSERT
  WITH CHECK (
    follower_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Users can unfollow (delete their own follows)
CREATE POLICY "Users can unfollow"
  ON public.followers
  FOR DELETE
  USING (
    follower_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_followers_follower_id ON public.followers(follower_id);
CREATE INDEX idx_followers_following_id ON public.followers(following_id);