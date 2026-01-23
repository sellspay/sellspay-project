-- Drop existing foreign key constraints on followers table if they exist
ALTER TABLE public.followers DROP CONSTRAINT IF EXISTS followers_follower_id_fkey;
ALTER TABLE public.followers DROP CONSTRAINT IF EXISTS followers_following_id_fkey;