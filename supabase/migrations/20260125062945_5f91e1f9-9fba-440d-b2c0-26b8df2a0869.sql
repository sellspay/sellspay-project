-- Fix the security definer view error by using security_invoker
-- The view needs security_invoker = on to comply with security best practices
-- This means the base table RLS must allow the view to access the data

-- Drop and recreate the view with security_invoker
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = on) AS
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

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- The current policies allow:
-- 1. Authenticated users to view creator/editor profiles (which exposes all fields)
-- 2. Users to view their own profile
-- 3. Admins to view all profiles

-- The issue is that authenticated users can still see ALL fields when querying the base table
-- We need to ensure the application uses public_profiles for public queries
-- and only uses profiles table for authenticated self-access or admin access

-- For anonymous users, we need a policy that allows the view to work
CREATE POLICY "Anonymous can view creator/editor profiles via view"
ON public.profiles FOR SELECT
TO anon
USING (is_creator = true OR is_editor = true);