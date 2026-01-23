-- Add visibility field to collections table
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS is_visible boolean DEFAULT true;

-- Create saved_products table for bookmarking
CREATE TABLE IF NOT EXISTS public.saved_products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE public.saved_products ENABLE ROW LEVEL SECURITY;

-- Users can view their own saved products
CREATE POLICY "Users can view their own saved products"
ON public.saved_products
FOR SELECT
USING (user_id IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()));

-- Users can save products
CREATE POLICY "Users can save products"
ON public.saved_products
FOR INSERT
WITH CHECK (user_id IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()));

-- Users can unsave products
CREATE POLICY "Users can unsave products"
ON public.saved_products
FOR DELETE
USING (user_id IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()));