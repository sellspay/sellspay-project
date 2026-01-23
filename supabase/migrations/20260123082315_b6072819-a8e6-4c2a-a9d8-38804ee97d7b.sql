-- Add background_url column for Steam-style profile backgrounds
ALTER TABLE public.profiles 
ADD COLUMN background_url TEXT;