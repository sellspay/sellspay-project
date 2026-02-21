
-- Add column to track subscription reward separately
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS subscription_rewarded_at timestamptz;

-- Update the process_referral_reward function
-- Now gives 10 credits to BOTH users when the referred user's balance reaches 0
CREATE OR REPLACE FUNCTION public.process_referral_reward(p_referred_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_referral RECORD;
  v_wallet RECORD;
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

  -- Check if the referred user's balance has hit 0
  SELECT balance INTO v_wallet
  FROM public.user_wallets
  WHERE user_id = p_referred_user_id;

  IF v_wallet IS NULL OR v_wallet.balance > 0 THEN
    RETURN jsonb_build_object('rewarded', false, 'reason', 'user_still_has_credits');
  END IF;

  -- Mark as rewarded
  UPDATE public.referrals
  SET status = 'rewarded', qualified_at = now(), rewarded_at = now()
  WHERE id = v_referral.id;

  -- Award 10 credits to the referrer
  SELECT public.add_credits(
    v_referral.referrer_id,
    10,
    'referral_reward',
    'Referral reward - friend used all their credits'
  ) INTO v_new_balance;

  -- Award 10 credits to the referred user too
  PERFORM public.add_credits(
    p_referred_user_id,
    10,
    'referral_bonus',
    'Referral bonus - welcome credits from referral'
  );

  RETURN jsonb_build_object(
    'rewarded', true,
    'referrer_credits', 10,
    'referred_bonus', 10
  );
END;
$function$;

-- Create a new function to process subscription referral reward (100 credits)
CREATE OR REPLACE FUNCTION public.process_referral_subscription_reward(p_referred_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_referral RECORD;
  v_new_balance INT;
BEGIN
  -- Find the referral for this user that hasn't had subscription reward yet
  SELECT * INTO v_referral
  FROM public.referrals
  WHERE referred_id = p_referred_user_id
  AND subscription_rewarded_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('rewarded', false, 'reason', 'no_eligible_referral');
  END IF;

  -- Mark subscription reward as given
  UPDATE public.referrals
  SET subscription_rewarded_at = now(),
      -- Also mark as rewarded if still pending
      status = CASE WHEN status = 'pending' THEN 'rewarded' ELSE status END,
      qualified_at = COALESCE(qualified_at, now()),
      rewarded_at = COALESCE(rewarded_at, now())
  WHERE id = v_referral.id;

  -- Award 100 credits to the referrer
  SELECT public.add_credits(
    v_referral.referrer_id,
    100,
    'referral_subscription_reward',
    'Referral reward - friend subscribed to a paid plan'
  ) INTO v_new_balance;

  -- Also give the subscriber a bonus
  PERFORM public.add_credits(
    p_referred_user_id,
    10,
    'referral_subscription_bonus',
    'Bonus credits for subscribing via referral'
  );

  RETURN jsonb_build_object(
    'rewarded', true,
    'referrer_credits', 100,
    'referred_bonus', 10
  );
END;
$function$;
