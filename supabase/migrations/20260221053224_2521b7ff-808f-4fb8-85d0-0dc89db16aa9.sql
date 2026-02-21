
-- Referral tracking table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES auth.users(id),
  referred_id UUID NOT NULL REFERENCES auth.users(id),
  referral_code TEXT NOT NULL,
  referred_ip TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, qualified, rewarded, blocked
  reward_credits INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  qualified_at TIMESTAMPTZ,
  rewarded_at TIMESTAMPTZ,
  UNIQUE(referred_id)
);

-- Each user gets a unique referral code
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Index for fast lookups
CREATE INDEX idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_status ON public.referrals(status);
CREATE INDEX idx_referrals_referred_ip ON public.referrals(referred_ip);
CREATE INDEX idx_profiles_referral_code ON public.profiles(referral_code);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Users can see their own referrals (as referrer)
CREATE POLICY "Users can view own referrals"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id);

-- Only backend (service role) can insert/update referrals
CREATE POLICY "Service role manages referrals"
  ON public.referrals FOR ALL
  USING (auth.uid() = referrer_id)
  WITH CHECK (auth.uid() = referrer_id);

-- Function to generate referral code for a user
CREATE OR REPLACE FUNCTION public.ensure_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_code TEXT;
  v_attempts INT := 0;
BEGIN
  IF NEW.referral_code IS NULL THEN
    LOOP
      v_code := LOWER(SUBSTRING(MD5(NEW.user_id::text || random()::text || clock_timestamp()::text) FROM 1 FOR 8));
      BEGIN
        NEW.referral_code := v_code;
        EXIT;
      EXCEPTION WHEN unique_violation THEN
        v_attempts := v_attempts + 1;
        IF v_attempts > 10 THEN
          NEW.referral_code := LOWER(SUBSTRING(MD5(NEW.user_id::text || random()::text || clock_timestamp()::text) FROM 1 FOR 12));
          EXIT;
        END IF;
      END;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ensure_referral_code
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (NEW.referral_code IS NULL)
  EXECUTE FUNCTION public.ensure_referral_code();

-- Backfill existing profiles with referral codes
UPDATE public.profiles
SET referral_code = LOWER(SUBSTRING(MD5(user_id::text || random()::text || clock_timestamp()::text) FROM 1 FOR 8))
WHERE referral_code IS NULL;

-- Function to check IP abuse (max 3 referrals from same IP)
CREATE OR REPLACE FUNCTION public.check_referral_ip_abuse(p_ip TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) < 3
    FROM public.referrals
    WHERE referred_ip = p_ip
    AND created_at > now() - interval '30 days'
  );
END;
$$;

-- Function to process referral reward when referred user uses credits
CREATE OR REPLACE FUNCTION public.process_referral_reward(p_referred_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referral RECORD;
  v_new_balance INT;
BEGIN
  -- Find pending referral for this user
  SELECT * INTO v_referral
  FROM public.referrals
  WHERE referred_id = p_referred_user_id
  AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('rewarded', false, 'reason', 'no_pending_referral');
  END IF;

  -- Mark as qualified first
  UPDATE public.referrals
  SET status = 'rewarded', qualified_at = now(), rewarded_at = now()
  WHERE id = v_referral.id;

  -- Award credits to the referrer
  SELECT public.add_credits(
    v_referral.referrer_id,
    v_referral.reward_credits,
    'referral_reward',
    'Referral reward - friend used a tool'
  ) INTO v_new_balance;

  -- Also give the referred user a small bonus
  PERFORM public.add_credits(
    p_referred_user_id,
    3,
    'referral_bonus',
    'Welcome bonus from referral'
  );

  RETURN jsonb_build_object(
    'rewarded', true,
    'referrer_credits', v_referral.reward_credits,
    'referred_bonus', 3
  );
END;
$$;
