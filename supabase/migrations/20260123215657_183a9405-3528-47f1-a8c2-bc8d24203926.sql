-- Fix security definer view by making it security invoker
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
WITH (security_invoker = true)
AS
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
  editor_about,
  editor_services,
  editor_languages,
  editor_hourly_rate_cents,
  editor_country,
  editor_city,
  editor_social_links,
  verified,
  show_recent_uploads,
  created_at,
  updated_at
FROM profiles
WHERE suspended = false OR suspended IS NULL;