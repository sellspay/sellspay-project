-- Function to generate username from email
CREATE OR REPLACE FUNCTION public.generate_username_from_email(p_email TEXT)
RETURNS TEXT AS $$
DECLARE
  base_username TEXT;
  new_username TEXT;
  random_suffix TEXT;
  counter INT := 0;
BEGIN
  -- Extract the part before @ and clean it (only alphanumeric and underscores)
  base_username := lower(regexp_replace(split_part(p_email, '@', 1), '[^a-zA-Z0-9]', '', 'g'));
  
  -- Ensure minimum length of 3
  IF length(base_username) < 3 THEN
    base_username := base_username || 'user';
  END IF;
  
  -- Truncate if too long (leave room for suffix)
  IF length(base_username) > 20 THEN
    base_username := left(base_username, 20);
  END IF;
  
  -- Try with random 4-digit suffix
  LOOP
    random_suffix := lpad(floor(random() * 10000)::text, 4, '0');
    new_username := base_username || random_suffix;
    
    -- Check if this username is available
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE username = new_username) THEN
      RETURN new_username;
    END IF;
    
    counter := counter + 1;
    -- Safety: after 100 attempts, use timestamp-based suffix
    IF counter > 100 THEN
      RETURN base_username || extract(epoch from now())::bigint::text;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to auto-assign username on profile insert/update if missing
CREATE OR REPLACE FUNCTION public.ensure_profile_username()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Only proceed if username is null or empty
  IF NEW.username IS NULL OR NEW.username = '' THEN
    -- Get the user's email from auth.users
    SELECT email INTO user_email 
    FROM auth.users 
    WHERE id = NEW.user_id;
    
    IF user_email IS NOT NULL THEN
      NEW.username := generate_username_from_email(user_email);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS trigger_ensure_profile_username ON public.profiles;
CREATE TRIGGER trigger_ensure_profile_username
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_profile_username();

-- Fix existing profiles without usernames
DO $$
DECLARE
  profile_record RECORD;
  user_email TEXT;
  new_username TEXT;
BEGIN
  FOR profile_record IN 
    SELECT p.id, p.user_id 
    FROM public.profiles p 
    WHERE p.username IS NULL OR p.username = ''
  LOOP
    SELECT email INTO user_email 
    FROM auth.users 
    WHERE id = profile_record.user_id;
    
    IF user_email IS NOT NULL THEN
      new_username := public.generate_username_from_email(user_email);
      UPDATE public.profiles SET username = new_username WHERE id = profile_record.id;
    END IF;
  END LOOP;
END $$;