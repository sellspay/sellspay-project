-- Add banner_url column to profiles for custom banners
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;