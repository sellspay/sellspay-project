-- Create a public view that excludes sensitive fields from profiles
-- This view will be used for public profile display (creators list, product pages, etc.)
CREATE OR REPLACE VIEW public.public_profiles 
WITH (security_invoker = on) AS
SELECT 
  id,
  user_id,
  username,
  full_name,
  avatar_url,
  bio,
  website,
  social_links,
  is_creator,
  is_editor,
  verified,
  created_at,
  updated_at,
  background_url,
  banner_url,
  show_recent_uploads,
  -- Editor public fields (for hire editors page)
  editor_hourly_rate_cents,
  editor_services,
  editor_languages,
  editor_country,
  editor_city,
  editor_about,
  editor_social_links
FROM public.profiles;

-- Grant access to the public view
GRANT SELECT ON public.public_profiles TO authenticated, anon;

-- Update RLS policies on profiles table
-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Users can only view their own full profile (with email, phone, stripe info)
CREATE POLICY "Users can view their own full profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all full profiles  
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Service role can access all profiles (for edge functions)
CREATE POLICY "Service role can view all profiles"
  ON public.profiles FOR SELECT
  TO service_role
  USING (true);

-- Add input validation to is_username_available function
CREATE OR REPLACE FUNCTION public.is_username_available(p_username TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
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
  
  RETURN NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE LOWER(username) = LOWER(p_username)
  );
END;
$$;

-- Insert admin role for the admin user (if not already exists)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role 
FROM auth.users 
WHERE email = 'vizual90@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;