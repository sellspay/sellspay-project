-- Add credit_balance column to profiles table (5 free credits for new users)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credit_balance integer DEFAULT 5;

-- Create credit_transactions table to track all credit movements
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'usage', 'bonus', 'refund')),
  amount INTEGER NOT NULL,
  description TEXT,
  tool_id TEXT,
  package_id UUID,
  stripe_session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create credit_packages table to store available packages
CREATE TABLE public.credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  stripe_price_id TEXT,
  stripe_product_id TEXT,
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on credit_transactions
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view their own credit transactions"
ON public.credit_transactions
FOR SELECT
USING (auth.uid() = user_id);

-- Only service role can insert transactions (via edge functions)
CREATE POLICY "Service role can insert credit transactions"
ON public.credit_transactions
FOR INSERT
WITH CHECK (true);

-- Enable RLS on credit_packages
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;

-- Anyone can view active credit packages
CREATE POLICY "Anyone can view active credit packages"
ON public.credit_packages
FOR SELECT
USING (is_active = true);

-- Create index for faster transaction queries
CREATE INDEX idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);

-- Insert the 5 credit package tiers
INSERT INTO public.credit_packages (name, credits, price_cents, display_order, is_popular) VALUES
  ('Starter', 15, 499, 1, false),
  ('Basic', 50, 999, 2, false),
  ('Pro', 150, 2499, 3, true),
  ('Power', 350, 4999, 4, false),
  ('Enterprise', 800, 9999, 5, false);