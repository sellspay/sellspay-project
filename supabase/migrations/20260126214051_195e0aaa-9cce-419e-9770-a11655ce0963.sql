-- Add PayPal fields to private.seller_config table
ALTER TABLE private.seller_config
ADD COLUMN IF NOT EXISTS paypal_email text,
ADD COLUMN IF NOT EXISTS paypal_payout_enabled boolean DEFAULT false;

-- Create RPC function to update PayPal config
CREATE OR REPLACE FUNCTION public.update_seller_paypal_config(
  p_user_id uuid,
  p_paypal_email text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE private.seller_config
  SET 
    paypal_email = p_paypal_email,
    paypal_payout_enabled = true
  WHERE user_id = p_user_id;
  
  -- If no row was updated, insert one
  IF NOT FOUND THEN
    INSERT INTO private.seller_config (user_id, paypal_email, paypal_payout_enabled)
    VALUES (p_user_id, p_paypal_email, true);
  END IF;
END;
$$;

-- Drop and recreate get_seller_config to include PayPal fields
DROP FUNCTION IF EXISTS public.get_seller_config(uuid);

CREATE FUNCTION public.get_seller_config(p_user_id uuid)
RETURNS TABLE(
  stripe_account_id text, 
  stripe_onboarding_complete boolean, 
  payoneer_payee_id text, 
  payoneer_status text,
  paypal_email text,
  paypal_payout_enabled boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.stripe_account_id,
    sc.stripe_onboarding_complete,
    sc.payoneer_payee_id,
    sc.payoneer_status,
    sc.paypal_email,
    sc.paypal_payout_enabled
  FROM private.seller_config sc
  WHERE sc.user_id = p_user_id;
END;
$$;

-- Create function to disconnect PayPal
CREATE OR REPLACE FUNCTION public.disconnect_seller_paypal(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE private.seller_config
  SET 
    paypal_email = NULL,
    paypal_payout_enabled = false
  WHERE user_id = p_user_id;
END;
$$;