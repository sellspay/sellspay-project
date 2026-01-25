-- CRITICAL FIX: Remove anonymous direct access to profiles table
-- The view public_profiles correctly excludes sensitive fields,
-- but the RLS policy allows anon to query the base table directly, exposing all columns

-- Drop the problematic policy that exposes all columns to anonymous users
DROP POLICY IF EXISTS "Anonymous can view creator/editor profiles via view" ON public.profiles;

-- Recreate the view WITHOUT security_invoker so it acts as a secure gateway
-- This view runs with DEFINER privileges (the view owner's privileges, not the caller's)
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
  -- EXPLICITLY EXCLUDING: email, phone, stripe_account_id, payoneer_email, payoneer_payee_id, 
  -- payoneer_status, resend_vault_secret_id, seller_support_email, pending_email, etc.
FROM public.profiles
WHERE is_creator = true OR is_editor = true;

-- Grant SELECT on the view to all roles
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Add comment explaining the security design
COMMENT ON VIEW public.public_profiles IS 'Public-facing view of profiles that excludes sensitive PII (email, phone, payment account IDs). Use this view for all public profile queries.';