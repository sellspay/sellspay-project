-- Add style_options JSONB column to collections for animation and other styling
ALTER TABLE public.collections 
ADD COLUMN IF NOT EXISTS style_options JSONB DEFAULT '{}'::jsonb;