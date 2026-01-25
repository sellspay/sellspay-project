-- =====================================================
-- FIX 1: Lock down user_roles table, add safe owner check RPC
-- =====================================================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can read owner role" ON public.user_roles;
DROP POLICY IF EXISTS "Public can read owner role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;

-- Create strict policies: users can only see their own roles
CREATE POLICY "Users can read their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Create a SECURITY DEFINER function to safely check if someone is owner
-- This does NOT expose the user_roles table directly
CREATE OR REPLACE FUNCTION public.is_owner(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = p_user_id
      AND role = 'owner'
  )
$$;

-- =====================================================
-- FIX 2: Lock public_identities_cache, create minimal public view
-- =====================================================

-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Anyone can read identities" ON public.public_identities_cache;
DROP POLICY IF EXISTS "Allow public read access to identities cache" ON public.public_identities_cache;

-- Lock the table - no direct access
CREATE POLICY "No direct access to identities cache"
ON public.public_identities_cache
FOR SELECT
USING (false);

-- Create a minimal public view with ONLY display-safe fields (no user_id mapping)
CREATE OR REPLACE VIEW public.safe_public_identities
WITH (security_invoker = on)
AS
SELECT 
  id,  -- profile id only, not auth user_id
  username,
  full_name,
  avatar_url,
  verified,
  is_creator,
  is_editor
FROM public.public_identities_cache;

-- Grant access to the view
GRANT SELECT ON public.safe_public_identities TO anon, authenticated;

-- =====================================================
-- FIX 3: Ensure public_profiles view is security_invoker
-- (recreate if needed to fix linter warning)
-- =====================================================

-- Drop and recreate with security_invoker
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = on)
AS
SELECT 
  id,
  user_id,
  username,
  full_name,
  avatar_url,
  banner_url,
  background_url,
  bio,
  website,
  social_links,
  verified,
  is_creator,
  is_editor,
  show_recent_uploads,
  editor_about,
  editor_city,
  editor_country,
  editor_hourly_rate_cents,
  editor_languages,
  editor_services,
  editor_social_links,
  created_at,
  updated_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- =====================================================
-- FIX 4: Recreate public_identities view with security_invoker
-- =====================================================

DROP VIEW IF EXISTS public.public_identities;

CREATE VIEW public.public_identities
WITH (security_invoker = on)
AS
SELECT 
  id,
  user_id,
  username,
  full_name,
  avatar_url,
  verified,
  is_creator,
  is_editor
FROM public.profiles;

GRANT SELECT ON public.public_identities TO anon, authenticated;

-- =====================================================
-- FIX 5: Recreate public_products view with security_invoker
-- =====================================================

DROP VIEW IF EXISTS public.public_products;

CREATE VIEW public.public_products
WITH (security_invoker = on)
AS
SELECT 
  id,
  creator_id,
  name,
  slug,
  description,
  cover_image_url,
  preview_video_url,
  youtube_url,
  price_cents,
  currency,
  pricing_type,
  product_type,
  tags,
  status,
  featured,
  subscription_access,
  created_at,
  updated_at
FROM public.products
WHERE status = 'published';