-- Create verification_codes table for custom 2FA OTP storage
CREATE TABLE public.verification_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- Only the service role can access this table (edge functions use service role)
-- No public policies needed since we access via service role in edge functions

-- Create index for faster lookups
CREATE INDEX idx_verification_codes_user_id ON public.verification_codes(user_id);

-- Auto-cleanup expired codes (optional trigger)
CREATE OR REPLACE FUNCTION public.cleanup_expired_verification_codes()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.verification_codes WHERE expires_at < now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_cleanup_expired_codes
AFTER INSERT ON public.verification_codes
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_expired_verification_codes();