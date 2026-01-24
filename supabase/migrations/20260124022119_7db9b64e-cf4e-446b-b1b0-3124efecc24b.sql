-- Add global font settings to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS global_font text DEFAULT 'default',
ADD COLUMN IF NOT EXISTS global_custom_font jsonb DEFAULT NULL;