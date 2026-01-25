-- Drop the broken trigger that references deleted table
DROP TRIGGER IF EXISTS ensure_seller_payment_config_trigger ON public.profiles;

-- Replace the function to use the correct private schema table
CREATE OR REPLACE FUNCTION public.ensure_seller_payment_config()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When is_seller becomes true, ensure payment config exists
  IF NEW.is_seller = true AND (OLD.is_seller IS NULL OR OLD.is_seller = false) THEN
    INSERT INTO private.seller_config (user_id)
    VALUES (NEW.user_id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate the trigger with the fixed function
CREATE TRIGGER ensure_seller_payment_config_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_seller_payment_config();