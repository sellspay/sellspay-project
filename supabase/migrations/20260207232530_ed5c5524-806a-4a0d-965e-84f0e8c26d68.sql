-- Add permanent ban tracking to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_permanently_banned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS permanent_ban_reason TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS banned_stripe_account_id TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.is_permanently_banned IS 'If true, user is permanently banned from becoming a seller';
COMMENT ON COLUMN public.profiles.permanent_ban_reason IS 'Reason for the permanent ban';
COMMENT ON COLUMN public.profiles.banned_at IS 'Timestamp when the user was permanently banned';
COMMENT ON COLUMN public.profiles.banned_stripe_account_id IS 'Stored Stripe account ID to prevent re-registration';