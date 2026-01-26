-- Table to store short-lived PayPal OAuth state tokens (CSRF protection)
CREATE TABLE IF NOT EXISTS public.paypal_oauth_states (
  state_token TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_paypal_oauth_states_expires_at
  ON public.paypal_oauth_states (expires_at);

-- Enable RLS (not required for Edge Function service role access, but keeps table safe)
ALTER TABLE public.paypal_oauth_states ENABLE ROW LEVEL SECURITY;

-- No public policies: keep it private to service_role only.

-- Cleanup function + trigger to keep the table small
CREATE OR REPLACE FUNCTION public.cleanup_expired_paypal_oauth_states()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.paypal_oauth_states
  WHERE expires_at < now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path TO 'public';

DROP TRIGGER IF EXISTS trg_cleanup_expired_paypal_oauth_states ON public.paypal_oauth_states;
CREATE TRIGGER trg_cleanup_expired_paypal_oauth_states
BEFORE INSERT ON public.paypal_oauth_states
FOR EACH ROW
EXECUTE FUNCTION public.cleanup_expired_paypal_oauth_states();
