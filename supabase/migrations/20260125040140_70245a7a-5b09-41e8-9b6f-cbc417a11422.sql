-- Recreate public-safe views so they can be queried without exposing PII in public.profiles
-- These views intentionally exclude email/phone/stripe/payoneer fields.

BEGIN;

DROP VIEW IF EXISTS public.public_identities;
DROP VIEW IF EXISTS public.public_profiles;

-- Public identities: minimal user info for comments, attribution, etc.
CREATE VIEW public.public_identities AS
SELECT
  p.id,
  p.user_id,
  p.username,
  p.full_name,
  p.avatar_url,
  p.is_creator,
  p.is_editor,
  p.verified
FROM public.profiles p;

-- Public profiles: safe public profile fields for /creators, /hire-editors, product creator cards
CREATE VIEW public.public_profiles AS
SELECT
  p.id,
  p.user_id,
  p.username,
  p.full_name,
  p.avatar_url,
  p.bio,
  p.website,
  p.verified,
  p.is_creator,
  p.is_editor,
  p.background_url,
  p.banner_url,
  p.show_recent_uploads,
  p.social_links,
  p.editor_about,
  p.editor_city,
  p.editor_country,
  p.editor_hourly_rate_cents,
  p.editor_languages,
  p.editor_services,
  p.editor_social_links,
  p.created_at,
  p.updated_at
FROM public.profiles p;

-- Allow API roles to read the views.
GRANT SELECT ON public.public_identities TO anon, authenticated;
GRANT SELECT ON public.public_profiles TO anon, authenticated;

COMMIT;
