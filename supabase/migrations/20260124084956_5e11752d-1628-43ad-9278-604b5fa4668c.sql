-- Add columns for username change tracking
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_username_changed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS previous_username TEXT,
ADD COLUMN IF NOT EXISTS previous_username_available_at TIMESTAMP WITH TIME ZONE;

-- Add column for pending email change
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS pending_email TEXT;

-- Create index for username availability check
CREATE INDEX IF NOT EXISTS idx_profiles_previous_username 
ON public.profiles (previous_username, previous_username_available_at)
WHERE previous_username IS NOT NULL;

-- Function to check if a username is available (including reserved ones)
CREATE OR REPLACE FUNCTION public.is_username_available_v2(p_username text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate input
  IF p_username IS NULL OR length(p_username) = 0 THEN
    RETURN false;
  END IF;
  
  IF length(p_username) > 50 THEN
    RETURN false;
  END IF;
  
  -- Check if username is currently in use
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE LOWER(username) = LOWER(p_username)
  ) THEN
    RETURN false;
  END IF;
  
  -- Check if username is reserved (within 14-day hold period)
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE LOWER(previous_username) = LOWER(p_username)
    AND previous_username_available_at > now()
  ) THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;