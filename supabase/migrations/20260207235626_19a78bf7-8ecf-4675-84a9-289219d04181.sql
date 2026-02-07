-- Create provider_fee_settings table for admin-managed payout provider fees
CREATE TABLE public.provider_fee_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_key TEXT NOT NULL UNIQUE, -- 'stripe', 'paypal', 'payoneer'
  provider_name TEXT NOT NULL,
  fixed_fee_cents INTEGER NOT NULL DEFAULT 30, -- e.g. $0.30 = 30 cents
  percentage_fee NUMERIC(5,3) NOT NULL DEFAULT 2.900, -- e.g. 2.9%
  cross_border_surcharge NUMERIC(5,3) NOT NULL DEFAULT 1.500, -- e.g. 1.5%
  safety_buffer NUMERIC(5,3) NOT NULL DEFAULT 0.500, -- e.g. 0.5%
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.provider_fee_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage fee settings (read-only for others for display purposes)
CREATE POLICY "Anyone can read fee settings" 
ON public.provider_fee_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage fee settings" 
ON public.provider_fee_settings 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger to update updated_at
CREATE TRIGGER update_provider_fee_settings_updated_at
BEFORE UPDATE ON public.provider_fee_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default provider configurations
INSERT INTO public.provider_fee_settings (provider_key, provider_name, fixed_fee_cents, percentage_fee, cross_border_surcharge, safety_buffer, notes) VALUES
('stripe', 'Stripe', 30, 2.900, 1.500, 0.500, 'Standard Stripe processing fees. 2.9% + $0.30 per transaction.'),
('paypal', 'PayPal', 49, 3.490, 1.500, 0.500, 'PayPal standard fees. 3.49% + $0.49. Higher for international.'),
('payoneer', 'Payoneer', 0, 2.000, 1.000, 0.500, 'Payoneer transfer fees. Typically 2% for withdrawals.');

-- Create function to calculate estimated seller payout
CREATE OR REPLACE FUNCTION public.calculate_estimated_seller_payout(
  p_product_price_cents INTEGER,
  p_platform_fee_percent NUMERIC,
  p_provider_key TEXT,
  p_is_cross_border BOOLEAN DEFAULT false
)
RETURNS TABLE(
  gross_amount_cents INTEGER,
  platform_fee_cents INTEGER,
  provider_fixed_fee_cents INTEGER,
  provider_percentage_fee_cents INTEGER,
  cross_border_fee_cents INTEGER,
  safety_buffer_cents INTEGER,
  estimated_payout_cents INTEGER
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_settings RECORD;
  v_platform_fee INTEGER;
  v_provider_fixed INTEGER;
  v_provider_percentage INTEGER;
  v_cross_border INTEGER;
  v_buffer INTEGER;
  v_payout INTEGER;
BEGIN
  -- Get provider fee settings
  SELECT * INTO v_settings
  FROM public.provider_fee_settings
  WHERE provider_key = p_provider_key AND is_active = true;

  IF v_settings IS NULL THEN
    RAISE EXCEPTION 'Provider % not found or inactive', p_provider_key;
  END IF;

  -- Calculate platform fee (Salespay's cut)
  v_platform_fee := ROUND(p_product_price_cents * (p_platform_fee_percent / 100.0));

  -- Calculate provider fees
  v_provider_fixed := v_settings.fixed_fee_cents;
  v_provider_percentage := ROUND(p_product_price_cents * (v_settings.percentage_fee / 100.0));

  -- Cross-border surcharge (only if applicable)
  IF p_is_cross_border THEN
    v_cross_border := ROUND(p_product_price_cents * (v_settings.cross_border_surcharge / 100.0));
  ELSE
    v_cross_border := 0;
  END IF;

  -- Safety buffer
  v_buffer := ROUND(p_product_price_cents * (v_settings.safety_buffer / 100.0));

  -- Calculate final payout (never negative)
  v_payout := GREATEST(0, p_product_price_cents - v_platform_fee - v_provider_fixed - v_provider_percentage - v_cross_border - v_buffer);

  RETURN QUERY SELECT
    p_product_price_cents,
    v_platform_fee,
    v_provider_fixed,
    v_provider_percentage,
    v_cross_border,
    v_buffer,
    v_payout;
END;
$$;