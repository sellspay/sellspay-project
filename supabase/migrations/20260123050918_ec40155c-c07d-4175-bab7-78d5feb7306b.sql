-- Add missing columns to products table to match source schema
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS created_by text,
ADD COLUMN IF NOT EXISTS locked boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS attachments jsonb,
ADD COLUMN IF NOT EXISTS benefits text[],
ADD COLUMN IF NOT EXISTS duration_label text,
ADD COLUMN IF NOT EXISTS excerpt text;