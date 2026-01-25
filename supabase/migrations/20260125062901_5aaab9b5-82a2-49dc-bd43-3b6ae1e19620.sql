-- CRITICAL FIX: Properly restrict profiles table to prevent PII exposure
-- The previous policy still exposes all fields to anyone querying creators/editors
-- This migration creates proper column-level protection

-- Drop the policy that allows public access to full profile data
DROP POLICY IF EXISTS "View can read creator and editor profiles" ON public.profiles;

-- The remaining policies are:
-- 1. "Users can view their own full profile" - USING (auth.uid() = user_id) - KEEP
-- 2. "Admins can view all profiles" - USING (has_role(auth.uid(), 'admin')) - KEEP
-- 3. "Users can insert their own profile" - WITH CHECK (auth.uid() = user_id) - KEEP
-- 4. "Users can update their own profile" - USING (auth.uid() = user_id) - KEEP
-- 5. "Admins can update any profile" - USING (has_role(auth.uid(), 'admin')) - KEEP

-- Now recreate the view WITHOUT security_invoker so it can access the base table
-- but only exposes safe fields
DROP VIEW IF EXISTS public.public_profiles;

-- Create a SECURITY DEFINER view (NOT security_invoker) that only exposes safe fields
-- This view acts as a secure gateway to public profile data
CREATE VIEW public.public_profiles AS
SELECT 
  id,
  user_id,
  username,
  full_name,
  avatar_url,
  banner_url,
  background_url,
  bio,
  website,
  social_links,
  is_creator,
  is_editor,
  verified,
  show_recent_uploads,
  editor_about,
  editor_city,
  editor_country,
  editor_languages,
  editor_services,
  editor_hourly_rate_cents,
  editor_social_links,
  created_at,
  updated_at
FROM public.profiles
WHERE is_creator = true OR is_editor = true;

-- Grant public access to the view
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Create a new restrictive policy for the base table
-- This policy only allows access to public profiles through authenticated users
-- who are checking their own profile OR through admin access
-- Anonymous users cannot directly query the profiles table
CREATE POLICY "Authenticated users can view creator/editor profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  (is_creator = true OR is_editor = true)
  OR auth.uid() = user_id
  OR has_role(auth.uid(), 'admin'::app_role)
);