-- Add original_filename column to store the seller's original filename
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS original_filename TEXT;