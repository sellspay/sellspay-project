-- Public view for safe identity data (usernames/avatars) for all profiles (incl. non-creators)
-- This is used for comments, likes, etc. where everyone should be displayable.

CREATE OR REPLACE VIEW public.public_identities AS
SELECT
  id,
  user_id,
  username,
  full_name,
  avatar_url,
  verified,
  is_creator,
  is_editor
FROM public.profiles;

-- Ensure the view runs with definer privileges (bypasses RLS on profiles) while only exposing safe columns.
ALTER VIEW public.public_identities SET (security_invoker = off);

GRANT SELECT ON public.public_identities TO anon, authenticated;