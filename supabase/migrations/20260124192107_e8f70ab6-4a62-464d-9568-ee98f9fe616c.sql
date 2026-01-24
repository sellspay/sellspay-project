-- Add email notification preference to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_notifications_enabled boolean DEFAULT true;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.email_notifications_enabled IS 'Whether user wants to receive email notifications for creator product launches';