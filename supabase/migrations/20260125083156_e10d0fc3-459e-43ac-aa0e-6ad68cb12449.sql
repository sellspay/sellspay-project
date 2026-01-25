-- Create private schema (not accessible via PostgREST API)
CREATE SCHEMA IF NOT EXISTS private;

-- Revoke all access from anon and authenticated roles on private schema
REVOKE ALL ON SCHEMA private FROM anon, authenticated;

-- Grant usage only to service_role (for edge functions)
GRANT USAGE ON SCHEMA private TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA private TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA private GRANT ALL ON TABLES TO service_role;

-- Create private.user_pii table WITHOUT FK to auth.users (uses profile's user_id)
CREATE TABLE IF NOT EXISTS private.user_pii (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email text,
  phone text,
  pending_email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create private.seller_config table for sensitive payment data
CREATE TABLE IF NOT EXISTS private.seller_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  seller_support_email text,
  seller_email_verified boolean DEFAULT false,
  resend_vault_secret_id uuid,
  stripe_account_id text,
  stripe_onboarding_complete boolean DEFAULT false,
  subscription_stripe_id text,
  payoneer_email text,
  payoneer_payee_id text,
  payoneer_status text,
  preferred_payout_method text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Migrate existing PII data - only for users that exist in auth.users
INSERT INTO private.user_pii (user_id, email, phone, pending_email)
SELECT p.user_id, p.email, p.phone, p.pending_email
FROM public.profiles p
INNER JOIN auth.users u ON p.user_id = u.id
WHERE p.user_id IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- Migrate existing seller config - only for users that exist in auth.users
INSERT INTO private.seller_config (
  user_id, seller_support_email, seller_email_verified, resend_vault_secret_id,
  stripe_account_id, stripe_onboarding_complete, subscription_stripe_id,
  payoneer_email, payoneer_payee_id, payoneer_status, preferred_payout_method
)
SELECT 
  p.user_id, p.seller_support_email, p.seller_email_verified, p.resend_vault_secret_id,
  p.stripe_account_id, p.stripe_onboarding_complete, p.subscription_stripe_id,
  p.payoneer_email, p.payoneer_payee_id, p.payoneer_status, p.preferred_payout_method
FROM public.profiles p
INNER JOIN auth.users u ON p.user_id = u.id
WHERE p.user_id IS NOT NULL AND p.is_seller = true
ON CONFLICT (user_id) DO NOTHING;

-- Create SECURITY DEFINER functions to access private data (only callable by edge functions)
CREATE OR REPLACE FUNCTION private.get_user_pii(p_user_id uuid)
RETURNS TABLE (
  email text,
  phone text,
  pending_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private
AS $$
BEGIN
  RETURN QUERY
  SELECT u.email, u.phone, u.pending_email
  FROM private.user_pii u
  WHERE u.user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION private.get_seller_config(p_user_id uuid)
RETURNS TABLE (
  seller_support_email text,
  seller_email_verified boolean,
  has_resend_key boolean,
  stripe_account_id text,
  stripe_onboarding_complete boolean,
  payoneer_email text,
  payoneer_status text,
  preferred_payout_method text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.seller_support_email,
    s.seller_email_verified,
    s.resend_vault_secret_id IS NOT NULL,
    s.stripe_account_id,
    s.stripe_onboarding_complete,
    s.payoneer_email,
    s.payoneer_status,
    s.preferred_payout_method
  FROM private.seller_config s
  WHERE s.user_id = p_user_id;
END;
$$;

-- Function to update user PII (for edge functions)
CREATE OR REPLACE FUNCTION private.update_user_pii(
  p_user_id uuid,
  p_email text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_pending_email text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private
AS $$
BEGIN
  INSERT INTO private.user_pii (user_id, email, phone, pending_email)
  VALUES (p_user_id, p_email, p_phone, p_pending_email)
  ON CONFLICT (user_id) DO UPDATE SET
    email = COALESCE(p_email, private.user_pii.email),
    phone = COALESCE(p_phone, private.user_pii.phone),
    pending_email = COALESCE(p_pending_email, private.user_pii.pending_email),
    updated_at = now();
  RETURN true;
END;
$$;

-- Function to update seller config (for edge functions)
CREATE OR REPLACE FUNCTION private.update_seller_config(
  p_user_id uuid,
  p_seller_support_email text DEFAULT NULL,
  p_seller_email_verified boolean DEFAULT NULL,
  p_resend_vault_secret_id uuid DEFAULT NULL,
  p_stripe_account_id text DEFAULT NULL,
  p_stripe_onboarding_complete boolean DEFAULT NULL,
  p_payoneer_email text DEFAULT NULL,
  p_payoneer_payee_id text DEFAULT NULL,
  p_payoneer_status text DEFAULT NULL,
  p_preferred_payout_method text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private
AS $$
BEGIN
  INSERT INTO private.seller_config (
    user_id, seller_support_email, seller_email_verified, resend_vault_secret_id,
    stripe_account_id, stripe_onboarding_complete, payoneer_email, 
    payoneer_payee_id, payoneer_status, preferred_payout_method
  )
  VALUES (
    p_user_id, p_seller_support_email, p_seller_email_verified, p_resend_vault_secret_id,
    p_stripe_account_id, p_stripe_onboarding_complete, p_payoneer_email,
    p_payoneer_payee_id, p_payoneer_status, p_preferred_payout_method
  )
  ON CONFLICT (user_id) DO UPDATE SET
    seller_support_email = COALESCE(p_seller_support_email, private.seller_config.seller_support_email),
    seller_email_verified = COALESCE(p_seller_email_verified, private.seller_config.seller_email_verified),
    resend_vault_secret_id = COALESCE(p_resend_vault_secret_id, private.seller_config.resend_vault_secret_id),
    stripe_account_id = COALESCE(p_stripe_account_id, private.seller_config.stripe_account_id),
    stripe_onboarding_complete = COALESCE(p_stripe_onboarding_complete, private.seller_config.stripe_onboarding_complete),
    payoneer_email = COALESCE(p_payoneer_email, private.seller_config.payoneer_email),
    payoneer_payee_id = COALESCE(p_payoneer_payee_id, private.seller_config.payoneer_payee_id),
    payoneer_status = COALESCE(p_payoneer_status, private.seller_config.payoneer_status),
    preferred_payout_method = COALESCE(p_preferred_payout_method, private.seller_config.preferred_payout_method),
    updated_at = now();
  RETURN true;
END;
$$;

-- Grant execute on private functions to service_role only
GRANT EXECUTE ON FUNCTION private.get_user_pii(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION private.get_seller_config(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION private.update_user_pii(uuid, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION private.update_seller_config(uuid, text, boolean, uuid, text, boolean, text, text, text, text) TO service_role;

-- Drop sensitive columns from public.profiles (they're now in private schema)
ALTER TABLE public.profiles 
  DROP COLUMN IF EXISTS email,
  DROP COLUMN IF EXISTS phone,
  DROP COLUMN IF EXISTS pending_email,
  DROP COLUMN IF EXISTS seller_support_email,
  DROP COLUMN IF EXISTS seller_email_verified,
  DROP COLUMN IF EXISTS resend_vault_secret_id,
  DROP COLUMN IF EXISTS stripe_account_id,
  DROP COLUMN IF EXISTS stripe_onboarding_complete,
  DROP COLUMN IF EXISTS subscription_stripe_id,
  DROP COLUMN IF EXISTS payoneer_email,
  DROP COLUMN IF EXISTS payoneer_payee_id,
  DROP COLUMN IF EXISTS payoneer_status,
  DROP COLUMN IF EXISTS preferred_payout_method;

-- Update handle_new_user to also create private.user_pii record
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create public profile (no PII)
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  
  -- Create private PII record
  INSERT INTO private.user_pii (user_id, email)
  VALUES (NEW.id, NEW.email);
  
  RETURN NEW;
END;
$$;

-- Recreate public_profiles view WITHOUT any PII columns
DROP VIEW IF EXISTS public.public_profiles CASCADE;
CREATE VIEW public.public_profiles WITH (security_barrier = true) AS
SELECT 
  p.id,
  p.user_id,
  p.username,
  p.full_name,
  p.avatar_url,
  p.banner_url,
  p.background_url,
  p.bio,
  p.website,
  p.social_links,
  p.verified,
  p.is_creator,
  p.is_editor,
  p.is_seller,
  p.show_recent_uploads,
  p.global_font,
  p.global_custom_font,
  p.editor_about,
  p.editor_city,
  p.editor_country,
  p.editor_hourly_rate_cents,
  p.editor_languages,
  p.editor_services,
  p.editor_social_links,
  p.created_at,
  p.updated_at,
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = p.user_id AND ur.role = 'owner'
  ) AS is_owner
FROM public.profiles p;

-- Grant SELECT on public view to all
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Recreate public_identities view
DROP VIEW IF EXISTS public.public_identities CASCADE;
CREATE VIEW public.public_identities WITH (security_barrier = true) AS
SELECT 
  p.id,
  p.user_id,
  p.username,
  p.full_name,
  p.avatar_url,
  p.verified,
  p.is_creator,
  p.is_editor,
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = p.user_id AND ur.role = 'owner'
  ) AS is_owner
FROM public.profiles p;

GRANT SELECT ON public.public_identities TO anon, authenticated;

-- Recreate safe_public_identities view
DROP VIEW IF EXISTS public.safe_public_identities CASCADE;
CREATE VIEW public.safe_public_identities WITH (security_barrier = true) AS
SELECT 
  p.id,
  p.username,
  p.full_name,
  p.avatar_url,
  p.verified,
  p.is_creator,
  p.is_editor,
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = p.user_id AND ur.role = 'owner'
  ) AS is_owner
FROM public.profiles p;

GRANT SELECT ON public.safe_public_identities TO anon, authenticated;

-- Clean up orphaned profiles (no corresponding auth.users record)
DELETE FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.user_id);