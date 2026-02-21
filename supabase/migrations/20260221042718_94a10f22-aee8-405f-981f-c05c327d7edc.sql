-- Create cart_items table
CREATE TABLE public.cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Users can view their own cart
CREATE POLICY "Users can view their own cart items"
ON public.cart_items FOR SELECT
USING (user_id IN (SELECT id FROM profiles WHERE profiles.user_id = auth.uid()));

-- Users can add to their own cart
CREATE POLICY "Users can add to their own cart"
ON public.cart_items FOR INSERT
WITH CHECK (user_id IN (SELECT id FROM profiles WHERE profiles.user_id = auth.uid()));

-- Users can remove from their own cart
CREATE POLICY "Users can remove from their own cart"
ON public.cart_items FOR DELETE
USING (user_id IN (SELECT id FROM profiles WHERE profiles.user_id = auth.uid()));

-- Index for fast lookups
CREATE INDEX idx_cart_items_user_id ON public.cart_items(user_id);
CREATE INDEX idx_cart_items_product_id ON public.cart_items(product_id);