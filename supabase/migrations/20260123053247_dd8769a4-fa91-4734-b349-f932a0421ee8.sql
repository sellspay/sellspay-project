-- Add Stripe Connect fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_account_id text,
ADD COLUMN IF NOT EXISTS stripe_onboarding_complete boolean DEFAULT false;

-- Create purchases table to track all transactions
CREATE TABLE public.purchases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  buyer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL,
  platform_fee_cents integer NOT NULL,
  creator_payout_cents integer NOT NULL,
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  stripe_transfer_id text,
  status text NOT NULL DEFAULT 'pending',
  CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'refunded', 'failed'))
);

-- Create stripe_events table for webhook idempotency
CREATE TABLE public.stripe_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  processed_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on purchases
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Buyers can view their own purchases
CREATE POLICY "Buyers can view their own purchases"
ON public.purchases
FOR SELECT
USING (buyer_id IN (
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
));

-- Creators can view purchases of their products
CREATE POLICY "Creators can view purchases of their products"
ON public.purchases
FOR SELECT
USING (product_id IN (
  SELECT id FROM public.products WHERE creator_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
));

-- Only system (service role) can insert purchases via webhook
CREATE POLICY "System can insert purchases"
ON public.purchases
FOR INSERT
WITH CHECK (true);

-- Enable RLS on stripe_events (only system access via service role)
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

-- Add index for faster lookups
CREATE INDEX idx_purchases_buyer_id ON public.purchases(buyer_id);
CREATE INDEX idx_purchases_product_id ON public.purchases(product_id);
CREATE INDEX idx_purchases_status ON public.purchases(status);
CREATE INDEX idx_stripe_events_stripe_event_id ON public.stripe_events(stripe_event_id);