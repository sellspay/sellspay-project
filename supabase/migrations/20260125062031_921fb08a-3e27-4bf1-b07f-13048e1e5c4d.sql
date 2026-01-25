-- Fix: Convert security definer view to security invoker with proper RLS policy

-- Step 1: Drop the current security definer view
DROP VIEW IF EXISTS public.public_profiles;

-- Step 2: Add a restrictive RLS policy that ONLY allows viewing creator/editor profiles
-- This policy is safe because it only permits reading rows for public profiles (creators/editors)
-- The underlying profiles table still blocks access to non-creator/editor rows
CREATE POLICY "Anyone can view creator and editor profiles"
ON public.profiles
FOR SELECT
USING ((is_creator = true) OR (is_editor = true));

-- Step 3: Recreate the view with security_invoker = ON (default, runs as querying user)
-- This view ONLY selects non-sensitive columns and relies on RLS for row-level filtering
CREATE VIEW public.public_profiles
WITH (security_invoker = on) AS
SELECT 
  id,
  user_id,
  username,
  full_name,
  avatar_url,
  bio,
  website,
  banner_url,
  background_url,
  is_creator,
  is_editor,
  verified,
  show_recent_uploads,
  social_links,
  editor_about,
  editor_city,
  editor_country,
  editor_languages,
  editor_services,
  editor_hourly_rate_cents,
  editor_social_links,
  created_at,
  updated_at
FROM public.profiles;

-- Step 4: Grant SELECT on the view to both anon and authenticated roles
GRANT SELECT ON public.public_profiles TO anon;
GRANT SELECT ON public.public_profiles TO authenticated;