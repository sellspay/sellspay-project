-- Create product_downloads table for rate limiting
CREATE TABLE IF NOT EXISTS public.product_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient querying
CREATE INDEX idx_product_downloads_user_product 
ON public.product_downloads(user_id, product_id, downloaded_at);

-- Enable RLS
ALTER TABLE public.product_downloads ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own downloads"
ON public.product_downloads FOR SELECT
USING (user_id IN (
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Edge functions can insert downloads"
ON public.product_downloads FOR INSERT
WITH CHECK (true);