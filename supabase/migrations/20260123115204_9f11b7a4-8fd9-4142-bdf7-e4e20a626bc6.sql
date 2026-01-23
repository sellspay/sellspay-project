-- Function to check if email is available
CREATE OR REPLACE FUNCTION public.is_email_available(p_email text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF p_email IS NULL OR length(p_email) = 0 THEN
    RETURN false;
  END IF;
  
  -- Validate email length (max 254 per RFC 5321)
  IF length(p_email) > 254 THEN
    RETURN false;
  END IF;
  
  RETURN NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE LOWER(email) = LOWER(p_email)
  );
END;
$$;

-- Function to get email by username for login
CREATE OR REPLACE FUNCTION public.get_email_by_username(p_username text)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_email text;
BEGIN
  IF p_username IS NULL OR length(p_username) = 0 THEN
    RETURN NULL;
  END IF;
  
  -- Validate username length
  IF length(p_username) > 50 THEN
    RETURN NULL;
  END IF;
  
  SELECT email INTO user_email
  FROM public.profiles
  WHERE LOWER(username) = LOWER(p_username)
  LIMIT 1;
  
  RETURN user_email;
END;
$$;