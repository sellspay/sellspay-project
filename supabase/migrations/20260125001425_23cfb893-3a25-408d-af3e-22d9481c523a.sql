-- Add subscription tier columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS subscription_stripe_id TEXT DEFAULT NULL;

-- Create credit_topups table for one-time credit purchases
CREATE TABLE IF NOT EXISTS public.credit_topups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  stripe_price_id TEXT,
  stripe_product_id TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on credit_topups
ALTER TABLE public.credit_topups ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read active topups
CREATE POLICY "Anyone can view active topups" 
ON public.credit_topups 
FOR SELECT 
USING (is_active = true);

-- Insert top-up packages (premium pricing)
INSERT INTO public.credit_topups (name, credits, price_cents, display_order) VALUES
('Small', 15, 799, 1),
('Medium', 50, 2499, 2),
('Large', 100, 4499, 3),
('Mega', 250, 9999, 4);

-- Update credit_packages to reflect new subscription tiers
-- First, deactivate old packages
UPDATE public.credit_packages SET is_active = false;

-- Insert new tier-based subscription packages
INSERT INTO public.credit_packages (name, credits, price_cents, display_order, is_active) VALUES
('Starter', 60, 1999, 1, true),
('Pro', 150, 4999, 2, true),
('Enterprise', 300, 9999, 3, true);