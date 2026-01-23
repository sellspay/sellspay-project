-- Remove the old permissive SELECT policy on profiles that may have been duplicated
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Ensure public_profiles view exists and the policies are correct
-- Add a policy for the view to work correctly - allow SELECT via the view for public data
-- This is done by querying the view, not the base table directly