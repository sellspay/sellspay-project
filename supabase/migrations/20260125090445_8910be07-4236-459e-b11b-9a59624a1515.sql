-- Fix get_email_by_username to use private.user_pii instead of public.profiles
CREATE OR REPLACE FUNCTION public.get_email_by_username(p_username text)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
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
  
  -- Join profiles with private.user_pii to get email
  SELECT pii.email INTO user_email
  FROM public.profiles p
  JOIN private.user_pii pii ON pii.user_id = p.user_id
  WHERE LOWER(p.username) = LOWER(p_username)
  LIMIT 1;
  
  RETURN user_email;
END;
$$;