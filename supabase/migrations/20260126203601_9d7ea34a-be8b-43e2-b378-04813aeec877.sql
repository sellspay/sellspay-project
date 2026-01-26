-- PART 1: Recreate safe_public_identities as a direct view of profiles (no cache sync issues)
DROP VIEW IF EXISTS public.safe_public_identities CASCADE;

CREATE VIEW public.safe_public_identities 
WITH (security_invoker = off)
AS
SELECT 
  p.id,
  p.user_id,
  p.username,
  p.full_name,
  p.avatar_url,
  p.verified,
  p.is_creator,
  p.is_editor,
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = p.user_id AND ur.role = 'owner'
  ) AS is_owner
FROM public.profiles p;

-- Grant public read access
GRANT SELECT ON public.safe_public_identities TO anon, authenticated;

-- PART 2: Update handle_new_user with robust metadata extraction
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_username text;
  v_full_name text;
BEGIN
  -- Extract username from metadata with proper null handling
  v_username := NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), '');
  
  -- Extract full_name with multiple fallbacks (Google uses 'name', regular signup uses 'full_name')
  v_full_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    SPLIT_PART(NEW.email, '@', 1) -- Fallback to email prefix
  );

  -- Create public profile WITH metadata from signup
  INSERT INTO public.profiles (
    user_id,
    username,
    full_name
  )
  VALUES (
    NEW.id,
    v_username,
    v_full_name
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
$$;

-- PART 3: Backfill usernames for existing users who are missing them
UPDATE public.profiles
SET username = LOWER(REGEXP_REPLACE(full_name, '[^a-zA-Z0-9]', '', 'g')) || '_' || SUBSTRING(id::text, 1, 4)
WHERE username IS NULL 
  AND full_name IS NOT NULL 
  AND full_name != '';