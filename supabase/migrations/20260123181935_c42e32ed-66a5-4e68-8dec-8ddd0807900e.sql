-- Add slug column to products table
ALTER TABLE public.products ADD COLUMN slug TEXT UNIQUE;

-- Create index for faster slug lookups
CREATE INDEX idx_products_slug ON public.products(slug);