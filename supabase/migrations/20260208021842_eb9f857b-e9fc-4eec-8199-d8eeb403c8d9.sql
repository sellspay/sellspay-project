-- Add RLS policy to allow anyone (including anonymous users) to view public profiles
-- This enables the public_profiles view to work correctly for unauthenticated visitors

CREATE POLICY "Anyone can view public profiles"
  ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (
    is_creator = true OR 
    verified = true OR 
    is_editor = true
  );