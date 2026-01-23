-- Add style_options column to profile_sections for storing background, color scheme, and preset configuration
ALTER TABLE public.profile_sections 
ADD COLUMN IF NOT EXISTS style_options JSONB NOT NULL DEFAULT '{}'::jsonb;