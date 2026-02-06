-- Fix the public_profiles view to use SECURITY INVOKER (default, safer)
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
  p.verified,
  p.website,
  p.social_links,
  p.created_at,
  p.creator_tags,
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = p.user_id AND ur.role = 'owner'
  ) as is_owner
FROM profiles p
WHERE p.is_creator = true OR p.verified = true;