-- Add payout method columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_payout_method TEXT DEFAULT 'stripe';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS payoneer_email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS payoneer_payee_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS payoneer_status TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.preferred_payout_method IS 'User preferred payout method: stripe, payoneer';
COMMENT ON COLUMN public.profiles.payoneer_email IS 'Payoneer account email for payouts';
COMMENT ON COLUMN public.profiles.payoneer_payee_id IS 'Payoneer payee ID from API registration';
COMMENT ON COLUMN public.profiles.payoneer_status IS 'Payoneer account status: pending, active, inactive';