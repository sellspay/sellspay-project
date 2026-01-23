-- Add column to persist the "Recent Uploads" visibility setting
ALTER TABLE public.profiles 
ADD COLUMN show_recent_uploads boolean DEFAULT true;