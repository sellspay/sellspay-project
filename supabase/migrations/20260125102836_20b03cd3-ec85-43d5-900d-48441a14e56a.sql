
-- Fix handle_new_user to read username/full_name from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Create public profile WITH metadata from signup
  INSERT INTO public.profiles (
    user_id,
    username,
    full_name
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name'
  );
  
  -- Create private PII record
  INSERT INTO private.user_pii (user_id, email, phone)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data->>'phone'
  );
  
  RETURN NEW;
END;
$function$;

-- Now fix the existing user who has NULL username
UPDATE public.profiles p
SET 
  username = u.raw_user_meta_data->>'username',
  full_name = u.raw_user_meta_data->>'full_name'
FROM auth.users u
WHERE p.user_id = u.id
  AND p.username IS NULL
  AND u.raw_user_meta_data->>'username' IS NOT NULL;
