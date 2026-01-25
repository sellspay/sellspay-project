-- ============================================
-- CREATE PRIVATE SCHEMA FOR SENSITIVE DATA
-- ============================================
-- This schema is NOT exposed via PostgREST API
-- Only accessible via service_role in edge functions

CREATE SCHEMA IF NOT EXISTS private;

-- Revoke all access from anon and authenticated roles
REVOKE ALL ON SCHEMA private FROM anon, authenticated;
GRANT USAGE ON SCHEMA private TO service_role;

-- ============================================
-- 1. PRIVATE USER SETTINGS (sensitive profile data)
-- ============================================
CREATE TABLE private.user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email text,
  phone text,
  pending_email text,
  mfa_enabled boolean DEFAULT false,
  credit_balance integer DEFAULT 0,
  subscription_stripe_id text,
  subscription_tier text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 2. PRIVATE PAYMENT CONFIG (seller payment data)
-- ============================================
CREATE TABLE private.payment_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  stripe_account_id text,
  stripe_onboarding_complete boolean DEFAULT false,
  payoneer_email text,
  payoneer_payee_id text,
  payoneer_status text,
  preferred_payout_method text,
  resend_vault_secret_id uuid,
  seller_support_email text,
  seller_email_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 3. PRIVATE PURCHASE PAYMENTS (Stripe IDs)
-- ============================================
CREATE TABLE private.purchase_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid NOT NULL UNIQUE,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  stripe_transfer_id text,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 4. PRIVATE BOOKING PAYMENTS (Editor booking Stripe IDs)
-- ============================================
CREATE TABLE private.booking_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL UNIQUE,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  stripe_transfer_id text,
  created_at timestamptz DEFAULT now()
);

-- Grant service_role full access to private tables
GRANT ALL ON private.user_settings TO service_role;
GRANT ALL ON private.payment_config TO service_role;
GRANT ALL ON private.purchase_payments TO service_role;
GRANT ALL ON private.booking_payments TO service_role;

-- Create indexes for performance
CREATE INDEX idx_private_user_settings_user_id ON private.user_settings(user_id);
CREATE INDEX idx_private_payment_config_user_id ON private.payment_config(user_id);
CREATE INDEX idx_private_purchase_payments_purchase_id ON private.purchase_payments(purchase_id);
CREATE INDEX idx_private_booking_payments_booking_id ON private.booking_payments(booking_id);

-- ============================================
-- 5. MIGRATE EXISTING DATA (only valid users)
-- ============================================

-- Migrate user settings from profiles (only for users that exist in auth.users)
INSERT INTO private.user_settings (user_id, email, phone, pending_email, mfa_enabled, credit_balance, subscription_stripe_id, subscription_tier)
SELECT p.user_id, p.email, p.phone, p.pending_email, COALESCE(p.mfa_enabled, false), COALESCE(p.credit_balance, 0), p.subscription_stripe_id, p.subscription_tier
FROM public.profiles p
WHERE EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.user_id)
ON CONFLICT (user_id) DO NOTHING;

-- Migrate payment config from profiles
INSERT INTO private.payment_config (user_id, stripe_account_id, stripe_onboarding_complete, payoneer_email, payoneer_payee_id, payoneer_status, preferred_payout_method, resend_vault_secret_id, seller_support_email, seller_email_verified)
SELECT p.user_id, p.stripe_account_id, COALESCE(p.stripe_onboarding_complete, false), p.payoneer_email, p.payoneer_payee_id, p.payoneer_status, p.preferred_payout_method, p.resend_vault_secret_id, p.seller_support_email, COALESCE(p.seller_email_verified, false)
FROM public.profiles p
WHERE EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.user_id)
ON CONFLICT (user_id) DO NOTHING;

-- Migrate purchase payment IDs
INSERT INTO private.purchase_payments (purchase_id, stripe_checkout_session_id, stripe_payment_intent_id, stripe_transfer_id)
SELECT id, stripe_checkout_session_id, stripe_payment_intent_id, stripe_transfer_id
FROM public.purchases
WHERE stripe_checkout_session_id IS NOT NULL OR stripe_payment_intent_id IS NOT NULL
ON CONFLICT (purchase_id) DO NOTHING;

-- Migrate booking payment IDs
INSERT INTO private.booking_payments (booking_id, stripe_checkout_session_id, stripe_payment_intent_id, stripe_transfer_id)
SELECT id, stripe_checkout_session_id, stripe_payment_intent_id, stripe_transfer_id
FROM public.editor_bookings
WHERE stripe_checkout_session_id IS NOT NULL OR stripe_payment_intent_id IS NOT NULL
ON CONFLICT (booking_id) DO NOTHING;

-- ============================================
-- 6. CREATE HELPER FUNCTIONS (service_role only)
-- ============================================

-- Get user settings (for edge functions)
CREATE OR REPLACE FUNCTION private.get_user_settings(p_user_id uuid)
RETURNS TABLE (
  email text,
  phone text,
  pending_email text,
  mfa_enabled boolean,
  credit_balance integer,
  subscription_stripe_id text,
  subscription_tier text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = private
AS $$
  SELECT email, phone, pending_email, mfa_enabled, credit_balance, subscription_stripe_id, subscription_tier
  FROM private.user_settings
  WHERE user_id = p_user_id;
$$;

-- Get payment config (for edge functions)
CREATE OR REPLACE FUNCTION private.get_payment_config(p_user_id uuid)
RETURNS TABLE (
  stripe_account_id text,
  stripe_onboarding_complete boolean,
  payoneer_email text,
  payoneer_payee_id text,
  payoneer_status text,
  preferred_payout_method text,
  seller_support_email text,
  seller_email_verified boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = private
AS $$
  SELECT stripe_account_id, stripe_onboarding_complete, payoneer_email, payoneer_payee_id, payoneer_status, preferred_payout_method, seller_support_email, seller_email_verified
  FROM private.payment_config
  WHERE user_id = p_user_id;
$$;

-- Update credit balance
CREATE OR REPLACE FUNCTION private.update_credit_balance(p_user_id uuid, p_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private
AS $$
BEGIN
  UPDATE private.user_settings
  SET credit_balance = credit_balance + p_amount, updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;

-- Get purchase payment info
CREATE OR REPLACE FUNCTION private.get_purchase_payment(p_purchase_id uuid)
RETURNS TABLE (
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  stripe_transfer_id text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = private
AS $$
  SELECT stripe_checkout_session_id, stripe_payment_intent_id, stripe_transfer_id
  FROM private.purchase_payments
  WHERE purchase_id = p_purchase_id;
$$;

-- ============================================
-- 7. TRIGGER TO AUTO-CREATE PRIVATE RECORDS
-- ============================================
CREATE OR REPLACE FUNCTION private.handle_new_user_private()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private
AS $$
BEGIN
  INSERT INTO private.user_settings (user_id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO private.payment_config (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users for new signups
DROP TRIGGER IF EXISTS on_auth_user_created_private ON auth.users;
CREATE TRIGGER on_auth_user_created_private
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION private.handle_new_user_private();