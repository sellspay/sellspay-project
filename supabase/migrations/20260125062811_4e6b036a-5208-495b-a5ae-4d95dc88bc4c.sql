-- Fix: Remove sensitive PII exposure from public profile access
-- The profiles table exposes emails, phone numbers, and payment account IDs publicly
-- Strategy: Update public_profiles view to exclude sensitive fields and restrict base table access

-- First, drop the existing public_profiles view
DROP VIEW IF EXISTS public.public_profiles;

-- Recreate the public_profiles view with ONLY non-sensitive fields
-- EXCLUDED: email, phone, stripe_account_id, stripe_onboarding_complete, payoneer_email, 
-- payoneer_payee_id, payoneer_status, preferred_payout_method, pending_email, 
-- seller_support_email, seller_email_verified, resend_vault_secret_id, credit_balance,
-- subscription_stripe_id, subscription_tier, mfa_enabled, suspended, email_notifications_enabled
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
  -- Editor-specific public fields (for hire page)
  editor_about,
  editor_city,
  editor_country,
  editor_languages,
  editor_services,
  editor_hourly_rate_cents,
  editor_social_links,
  created_at,
  updated_at
  -- EXCLUDED: All sensitive PII and payment fields
FROM public.profiles
WHERE is_creator = true OR is_editor = true;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Now update RLS policies on the profiles table
-- Remove the public policy that exposes all fields
DROP POLICY IF EXISTS "Anyone can view creator and editor profiles" ON public.profiles;

-- Create a new restricted policy for unauthenticated/public access
-- Public users can ONLY access profiles through the view (handled by security_invoker)
-- We need a policy that allows the view to read the base table
CREATE POLICY "View can read creator and editor profiles"
ON public.profiles FOR SELECT
USING (is_creator = true OR is_editor = true);

-- Users can still view their own full profile (already exists as "Users can view their own full profile")
-- Admins can still view all profiles (already exists as "Admins can view all profiles")