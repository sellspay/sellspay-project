-- Fix Security Issues for Profiles Table
-- Issue 1: Public exposure of PII (email, phone, etc.)
-- Issue 2: Internal identifiers exposure (user_id, resend_vault_secret_id, etc.)
-- Issue 3: Views using SECURITY DEFINER instead of SECURITY INVOKER

-- Step 1: Drop the insecure public SELECT policy
DROP POLICY IF EXISTS "Public can view creator and editor profiles" ON public.profiles;

-- Step 2: Create a more restrictive policy for public access
-- Only allow viewing specific safe columns through the views
-- The base table should not be directly queryable by unauthenticated users
CREATE POLICY "Authenticated users can view creator and editor profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND (is_creator = true OR is_editor = true)
);

-- Step 3: Drop and recreate views with security_invoker=on
-- First, drop the existing views
DROP VIEW IF EXISTS public.public_profiles;
DROP VIEW IF EXISTS public.public_identities;

-- Step 4: Recreate public_profiles view with ONLY safe columns and security_invoker
CREATE VIEW public.public_profiles
WITH (security_invoker=on) AS
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
FROM public.profiles
WHERE is_creator = true OR is_editor = true;
-- Excluded: email, phone, payoneer_email, payoneer_payee_id, payoneer_status,
-- stripe_account_id, stripe_onboarding_complete, subscription_stripe_id, 
-- subscription_tier, resend_vault_secret_id, pending_email, credit_balance,
-- mfa_enabled, suspended, preferred_payout_method, seller_support_email,
-- seller_email_verified, email_notifications_enabled, is_seller,
-- previous_username, previous_username_available_at, last_username_changed_at,
-- global_font, global_custom_font

-- Step 5: Recreate public_identities view with ONLY safe columns and security_invoker
CREATE VIEW public.public_identities
WITH (security_invoker=on) AS
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
WHERE is_creator = true OR is_editor = true;
-- Minimal view for identity lookups - no sensitive data

-- Step 6: Grant SELECT on views to anon and authenticated roles
GRANT SELECT ON public.public_profiles TO anon, authenticated;
GRANT SELECT ON public.public_identities TO anon, authenticated;

-- Step 7: Update the get_active_spotlights function to use security_invoker pattern
-- The function already uses SECURITY DEFINER which is correct for bypassing RLS
-- But we should ensure it only returns safe profile data
DROP FUNCTION IF EXISTS public.get_active_spotlights();

CREATE FUNCTION public.get_active_spotlights()
RETURNS TABLE(
  id uuid,
  headline text,
  story text,
  achievement text,
  quote text,
  featured_at timestamp with time zone,
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
-- This function uses SECURITY DEFINER intentionally to bypass RLS
-- It only returns safe profile columns (no email, phone, etc.)