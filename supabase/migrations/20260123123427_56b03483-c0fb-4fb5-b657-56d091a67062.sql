-- Add discount columns to subscription_plan_products table
ALTER TABLE public.subscription_plan_products 
ADD COLUMN IF NOT EXISTS is_free boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS discount_percent integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS discount_type text DEFAULT NULL;

-- Add constraint for discount percent (0-100)
ALTER TABLE public.subscription_plan_products 
ADD CONSTRAINT check_discount_percent CHECK (discount_percent IS NULL OR (discount_percent >= 0 AND discount_percent <= 100));

-- Add constraint for discount_type
ALTER TABLE public.subscription_plan_products 
ADD CONSTRAINT check_discount_type CHECK (discount_type IS NULL OR discount_type IN ('percentage', 'free'));