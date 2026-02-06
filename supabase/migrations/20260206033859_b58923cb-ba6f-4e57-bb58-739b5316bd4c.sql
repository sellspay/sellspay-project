-- Recreate public_profiles view with ALL needed columns including editor fields
DROP VIEW IF EXISTS public_profiles;

CREATE VIEW public_profiles WITH (security_invoker = true) AS
SELECT 
  p.id,
  p.user_id,
  p.username,
  p.full_name,
  p.avatar_url,
  p.banner_url,
  p.bio,
  p.is_creator,
  p.is_editor,
  p.verified,
  p.website,
  p.social_links,
  p.created_at,
  p.creator_tags,
  p.editor_hourly_rate_cents,
  p.editor_about,
  p.editor_city,
  p.editor_country,
  p.editor_languages,
  p.editor_services,
  p.editor_social_links,
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = p.user_id AND ur.role = 'owner'
  ) as is_owner
FROM profiles p
WHERE p.is_creator = true OR p.verified = true OR p.is_editor = true;