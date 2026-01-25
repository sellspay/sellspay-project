-- Fix RLS policy to allow anonymous users to see creator/editor profiles
-- The current policy requires auth.uid() IS NOT NULL which blocks anonymous users

-- Drop the overly restrictive policy
DROP POLICY IF EXISTS "Users can view public profile data" ON public.profiles;

-- Create a new policy that allows:
-- 1. Users to see their own full profile
-- 2. ANYONE (including anonymous) to see creator/editor profiles
-- 3. Admins to see everything
CREATE POLICY "Users can view public profile data"
ON public.profiles
FOR SELECT
USING (
  -- Users can always see their own full profile
  auth.uid() = user_id
  -- Anyone can see creator/editor profiles (needed for homepage, product pages)
  OR is_creator = true
  OR is_editor = true
  -- Admins can see everything
  OR has_role(auth.uid(), 'admin'::app_role)
);