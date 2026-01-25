
-- Rebuild sanitized public identity views to bypass profiles RLS by reading from the cache.
-- The app relies on these views (e.g., notifications) to resolve usernames/avatars for OTHER users.

CREATE OR REPLACE VIEW public.safe_public_identities
WITH (security_invoker = off)
AS
SELECT
  c.id,
  c.username,
  c.full_name,
  c.avatar_url,
  c.verified,
  c.is_creator,
  c.is_editor,
  c.is_owner
FROM public.public_identities_cache c;

CREATE OR REPLACE VIEW public.public_identities
WITH (security_invoker = off)
AS
SELECT
  c.id,
  c.user_id,
  c.username,
  c.full_name,
  c.avatar_url,
  c.verified,
  c.is_creator,
  c.is_editor,
  c.is_owner
FROM public.public_identities_cache c;
