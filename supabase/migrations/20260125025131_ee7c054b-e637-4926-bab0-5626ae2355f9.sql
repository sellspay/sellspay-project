-- Create table to track product page views with referrer and country data
CREATE TABLE public.product_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  viewer_id UUID NULL, -- null for anonymous visitors
  referrer TEXT NULL,
  referrer_domain TEXT NULL, -- extracted domain for grouping
  country_code TEXT NULL,
  city TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_product_views_product_id ON public.product_views(product_id);
CREATE INDEX idx_product_views_created_at ON public.product_views(created_at DESC);
CREATE INDEX idx_product_views_referrer_domain ON public.product_views(referrer_domain);
CREATE INDEX idx_product_views_country_code ON public.product_views(country_code);

-- Enable RLS
ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert views (for tracking)
CREATE POLICY "Anyone can create product views"
  ON public.product_views FOR INSERT
  WITH CHECK (true);

-- Only product owners can read their product views
CREATE POLICY "Product owners can view their product analytics"
  ON public.product_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.profiles pr ON p.creator_id = pr.id
      WHERE p.id = product_id AND pr.user_id = auth.uid()
    )
  );

-- Create table to track profile page views
CREATE TABLE public.profile_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  viewer_id UUID NULL,
  referrer TEXT NULL,
  referrer_domain TEXT NULL,
  country_code TEXT NULL,
  city TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_profile_views_profile_id ON public.profile_views(profile_id);
CREATE INDEX idx_profile_views_created_at ON public.profile_views(created_at DESC);

-- Enable RLS
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert views
CREATE POLICY "Anyone can create profile views"
  ON public.profile_views FOR INSERT
  WITH CHECK (true);

-- Only profile owners can read their views
CREATE POLICY "Profile owners can view their analytics"
  ON public.profile_views FOR SELECT
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));