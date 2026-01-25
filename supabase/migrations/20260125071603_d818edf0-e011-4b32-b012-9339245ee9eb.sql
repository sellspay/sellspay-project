-- Fix PUBLIC_USER_DATA: Protect sensitive PII from public exposure
-- The "Public can view creator and editor profiles" policy exposes emails, phones, and payment info

-- Step 1: Drop the existing public_profiles view (we'll recreate it with security_invoker)
DROP VIEW IF EXISTS public.public_profiles;

-- Step 2: Create a new SECURE public_profiles view that EXCLUDES all sensitive fields
CREATE VIEW public.public_profiles
WITH (security_invoker = on) AS
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
  -- Editor public info (rates, services, location - no contact details)
  editor_about,
  editor_city,
  editor_country,
  editor_languages,
  editor_services,
  editor_hourly_rate_cents,
  editor_social_links,
  -- Timestamps
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

-- Step 3: Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Public can view creator and editor profiles" ON public.profiles;

-- Step 4: Create a new policy that only allows public access via the view
-- Direct table access for public is now DENIED - they must use the view
-- The view with security_invoker will use the caller's privileges

-- We need to allow the view to read the filtered columns
-- Create a policy that allows public to SELECT but only via the secure view
-- This is done by having NO public SELECT policy on the base table

-- Keep existing policies that are properly scoped:
-- - "Users can only view their own profile" - auth.uid() = user_id ✓
-- - "Users can view their own full profile" - auth.uid() = user_id ✓  
-- - "Admins can view all profiles" - has_role admin ✓

-- Step 5: Grant SELECT on the safe view to anon and authenticated roles
GRANT SELECT ON public.public_profiles TO anon;
GRANT SELECT ON public.public_profiles TO authenticated;

-- Step 6: Also update public_identities view to be extra safe (already excludes PII but let's be explicit)
DROP VIEW IF EXISTS public.public_identities;

CREATE VIEW public.public_identities
WITH (security_invoker = on) AS
SELECT 
  id,
  user_id,
  username,
  full_name,
  avatar_url,
  is_creator,
  is_editor,
  verified
  -- NO email, phone, or other PII
FROM public.profiles
WHERE suspended IS NOT TRUE;

GRANT SELECT ON public.public_identities TO anon;
GRANT SELECT ON public.public_identities TO authenticated;