-- Create a dedicated table for sensitive seller payment configuration
-- This separates payment processor credentials from basic profile data
CREATE TABLE public.seller_payment_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_account_id text,
  stripe_onboarding_complete boolean DEFAULT false,
  payoneer_email text,
  payoneer_payee_id text,
  payoneer_status text,
  preferred_payout_method text DEFAULT 'stripe',
  resend_vault_secret_id uuid,
  seller_support_email text,
  seller_email_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS with very strict policies - NO admin access, only user's own data
ALTER TABLE public.seller_payment_config ENABLE ROW LEVEL SECURITY;

-- Only users can view their own payment config (no admin override for extra security)
CREATE POLICY "Users can only view their own payment config"
ON public.seller_payment_config FOR SELECT
USING (auth.uid() = user_id);

-- Only users can insert their own payment config
CREATE POLICY "Users can only insert their own payment config"
ON public.seller_payment_config FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Only users can update their own payment config
CREATE POLICY "Users can only update their own payment config"
ON public.seller_payment_config FOR UPDATE
USING (auth.uid() = user_id);

-- No delete policy - payment config should persist

-- Add trigger for updated_at
CREATE TRIGGER update_seller_payment_config_updated_at
  BEFORE UPDATE ON public.seller_payment_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing payment data from profiles to the new table
INSERT INTO public.seller_payment_config (
  user_id,
  stripe_account_id,
  stripe_onboarding_complete,
  payoneer_email,
  payoneer_payee_id,
  payoneer_status,
  preferred_payout_method,
  resend_vault_secret_id,
  seller_support_email,
  seller_email_verified
)
SELECT 
  user_id,
  stripe_account_id,
  COALESCE(stripe_onboarding_complete, false),
  payoneer_email,
  payoneer_payee_id,
  payoneer_status,
  COALESCE(preferred_payout_method, 'stripe'),
  resend_vault_secret_id,
  seller_support_email,
  COALESCE(seller_email_verified, false)
FROM public.profiles
WHERE stripe_account_id IS NOT NULL 
   OR payoneer_payee_id IS NOT NULL
   OR resend_vault_secret_id IS NOT NULL
   OR is_seller = true;

-- Create function to auto-create payment config when user becomes a seller
CREATE OR REPLACE FUNCTION public.ensure_seller_payment_config()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When is_seller becomes true, ensure payment config exists
  IF NEW.is_seller = true AND (OLD.is_seller IS NULL OR OLD.is_seller = false) THEN
    INSERT INTO public.seller_payment_config (user_id)
    VALUES (NEW.user_id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to auto-create payment config for new sellers
CREATE TRIGGER ensure_seller_payment_config_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_seller_payment_config();