-- Add new fields for global seller onboarding
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS payout_method TEXT,
ADD COLUMN IF NOT EXISTS payout_address TEXT,
ADD COLUMN IF NOT EXISTS platform_fee_percent NUMERIC(5,2) DEFAULT 10.00,
ADD COLUMN IF NOT EXISTS detected_country_code TEXT;

-- Add check constraint for payout_method values
ALTER TABLE public.profiles
ADD CONSTRAINT check_payout_method 
CHECK (payout_method IS NULL OR payout_method IN ('stripe', 'paypal', 'payoneer'));

-- Add column to country_eligibility for PayPal/Payoneer support
ALTER TABLE public.country_eligibility
ADD COLUMN IF NOT EXISTS paypal_eligible BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS payoneer_eligible BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS recommended_provider TEXT DEFAULT 'paypal';

-- Update recommended provider for Stripe-supported countries
UPDATE public.country_eligibility 
SET recommended_provider = 'stripe' 
WHERE connect_eligible = true;

-- Highlight Payoneer for specific regions (Pakistan, India, Bangladesh, etc.)
UPDATE public.country_eligibility 
SET recommended_provider = 'payoneer'
WHERE country_code IN ('PK', 'BD', 'NG', 'KE', 'GH', 'UG', 'TZ', 'ZW', 'ZM', 'EG', 'MA', 'TN', 'DZ')
AND connect_eligible = false;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_detected_country ON public.profiles(detected_country_code);

COMMENT ON COLUMN public.profiles.date_of_birth IS 'Seller date of birth for age verification (must be 18+)';
COMMENT ON COLUMN public.profiles.payout_method IS 'Preferred payout method: stripe, paypal, or payoneer';
COMMENT ON COLUMN public.profiles.payout_address IS 'Email or account ID for PayPal/Payoneer payouts';
COMMENT ON COLUMN public.profiles.platform_fee_percent IS 'Platform fee percentage based on subscription tier';
COMMENT ON COLUMN public.profiles.detected_country_code IS 'Auto-detected country from IP during onboarding';