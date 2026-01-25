-- Fix public views to work for anonymous users
-- The issue is security_invoker=on makes views use caller's privileges
-- Anonymous users don't have access to profiles table directly
-- Solution: Remove security_invoker so views run with owner (postgres) privileges

-- Recreate public_profiles view WITHOUT security_invoker
DROP VIEW IF EXISTS public.public_profiles;

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
  -- EXCLUDED: email, phone, pending_email, seller_support_email, 
  -- payoneer_email, payoneer_payee_id, payoneer_status, stripe_account_id,
  -- stripe_onboarding_complete, preferred_payout_method, mfa_enabled,
  -- credit_balance, subscription_tier, subscription_stripe_id,
  -- resend_vault_secret_id, seller_email_verified, suspended,
  -- is_seller, global_font, global_custom_font, previous_username,
  -- previous_username_available_at, last_username_changed_at, email_notifications_enabled
FROM public.profiles
WHERE (is_creator = true OR is_editor = true) AND suspended IS NOT TRUE;

-- Grant access to everyone
GRANT SELECT ON public.public_profiles TO anon;
GRANT SELECT ON public.public_profiles TO authenticated;

-- Recreate public_identities view WITHOUT security_invoker
DROP VIEW IF EXISTS public.public_identities;

CREATE VIEW public.public_identities AS
SELECT 
  id,
  user_id,
  username,
  full_name,
  avatar_url,
  is_creator,
  is_editor,
  verified
FROM public.profiles
WHERE suspended IS NOT TRUE;

GRANT SELECT ON public.public_identities TO anon;
GRANT SELECT ON public.public_identities TO authenticated;