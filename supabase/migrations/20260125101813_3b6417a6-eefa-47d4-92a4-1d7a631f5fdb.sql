-- Create RPC to safely get seller config from private schema
CREATE OR REPLACE FUNCTION public.get_seller_config(p_user_id uuid)
RETURNS TABLE (
  stripe_account_id text,
  stripe_onboarding_complete boolean,
  payoneer_payee_id text,
  payoneer_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.stripe_account_id,
    sc.stripe_onboarding_complete,
    sc.payoneer_payee_id,
    sc.payoneer_status
  FROM private.seller_config sc
  WHERE sc.user_id = p_user_id;
END;
$$;