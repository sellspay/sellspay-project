-- Create a SECURITY DEFINER function to fetch spotlight creators with profile data
CREATE OR REPLACE FUNCTION public.get_active_spotlights()
RETURNS TABLE (
  id uuid,
  headline text,
  story text,
  achievement text,
  quote text,
  featured_at timestamptz,
  profile_id uuid,
  profile_username text,
  profile_full_name text,
  profile_avatar_url text,
  profile_verified boolean,
  profile_bio text,
  profile_user_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    cs.id,
    cs.headline,
    cs.story,
    cs.achievement,
    cs.quote,
    cs.featured_at,
    cs.profile_id,
    p.username,
    p.full_name,
    p.avatar_url,
    p.verified,
    p.bio,
    p.user_id
  FROM creator_spotlights cs
  JOIN profiles p ON p.id = cs.profile_id
  WHERE cs.is_active = true
  ORDER BY cs.display_order ASC
  LIMIT 10;
$$;