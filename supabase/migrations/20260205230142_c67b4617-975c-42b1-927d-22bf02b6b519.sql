-- =====================================================
-- PHASE 2: NEW SUBSCRIPTION ECONOMY SCHEMA
-- Create the new 3-tier subscription system
-- =====================================================

-- 1. Create subscription_plans table (the 3 tiers)
CREATE TABLE public.subscription_plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  price_cents int NOT NULL,
  yearly_price_cents int,
  monthly_credits int NOT NULL DEFAULT 0,
  vibecoder_access boolean DEFAULT false,
  image_gen_access boolean DEFAULT false,
  video_gen_access boolean DEFAULT false,
  seller_fee_percent numeric(4,2) DEFAULT 10,
  badge_type text DEFAULT 'none',
  stripe_price_id text,
  stripe_yearly_price_id text,
  display_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Public read access for pricing page
CREATE POLICY "Anyone can read subscription plans"
  ON public.subscription_plans FOR SELECT
  USING (true);

-- 2. Insert the 3 tiers
INSERT INTO public.subscription_plans (id, name, price_cents, yearly_price_cents, monthly_credits, vibecoder_access, image_gen_access, video_gen_access, seller_fee_percent, badge_type, display_order)
VALUES 
  ('browser', 'Browser', 0, 0, 0, false, false, false, 10, 'none', 0),
  ('creator', 'Creator', 6900, 69000, 2500, true, true, false, 5, 'grey', 1),
  ('agency', 'Agency', 19900, 199000, 12000, true, true, true, 0, 'gold', 2);

-- 3. Create user_wallets table (atomic credit management)
CREATE TABLE public.user_wallets (
  user_id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  balance int NOT NULL DEFAULT 0,
  last_refill_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

-- Users can read their own wallet
CREATE POLICY "Users can read own wallet"
  ON public.user_wallets FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Create wallet_transactions table (audit trail)
CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  amount int NOT NULL,
  action text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Users can read their own transactions
CREATE POLICY "Users can read own transactions"
  ON public.wallet_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- 5. Add subscription columns to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS subscription_plan text DEFAULT 'browser' REFERENCES public.subscription_plans(id),
  ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- 6. Create deduct_credits function (atomic, race-condition safe)
CREATE OR REPLACE FUNCTION public.deduct_credits(p_user_id uuid, p_amount int, p_action text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_bal int;
BEGIN
  -- Lock the row to prevent race conditions
  SELECT balance INTO current_bal 
  FROM public.user_wallets 
  WHERE user_id = p_user_id 
  FOR UPDATE;
  
  -- If user doesn't have a wallet or insufficient funds
  IF current_bal IS NULL OR current_bal < p_amount THEN
    RETURN false;
  END IF;

  -- Deduct credits
  UPDATE public.user_wallets 
  SET balance = balance - p_amount 
  WHERE user_id = p_user_id;
  
  -- Log the transaction
  INSERT INTO public.wallet_transactions (user_id, amount, action, description)
  VALUES (p_user_id, -p_amount, p_action, 'AI generation');

  RETURN true;
END;
$$;

-- 7. Create add_credits function (for refills and top-ups)
CREATE OR REPLACE FUNCTION public.add_credits(p_user_id uuid, p_amount int, p_action text, p_description text DEFAULT NULL)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance int;
BEGIN
  -- Upsert wallet record
  INSERT INTO public.user_wallets (user_id, balance, last_refill_at)
  VALUES (p_user_id, p_amount, CASE WHEN p_action = 'monthly_refill' THEN now() ELSE NULL END)
  ON CONFLICT (user_id) DO UPDATE 
  SET 
    balance = user_wallets.balance + p_amount,
    last_refill_at = CASE WHEN p_action = 'monthly_refill' THEN now() ELSE user_wallets.last_refill_at END
  RETURNING balance INTO new_balance;
  
  -- Log the transaction
  INSERT INTO public.wallet_transactions (user_id, amount, action, description)
  VALUES (p_user_id, p_amount, p_action, COALESCE(p_description, 'Credits added'));

  RETURN new_balance;
END;
$$;

-- 8. Create trigger to initialize wallet on profile creation
CREATE OR REPLACE FUNCTION public.initialize_user_wallet()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_wallets (user_id, balance)
  VALUES (NEW.user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created_init_wallet ON public.profiles;
CREATE TRIGGER on_profile_created_init_wallet
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_user_wallet();