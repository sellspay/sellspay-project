-- =============================================
-- FIX 1: Secure INSERT policies on 5 tables
-- =============================================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can insert admin notifications" ON public.admin_notifications;
DROP POLICY IF EXISTS "Anyone can insert product downloads" ON public.product_downloads;
DROP POLICY IF EXISTS "Anyone can insert purchases" ON public.purchases;
DROP POLICY IF EXISTS "Anyone can insert product views" ON public.product_views;
DROP POLICY IF EXISTS "Anyone can insert profile views" ON public.profile_views;

-- Also drop any "enable insert" or similar policies
DROP POLICY IF EXISTS "Enable insert for all users" ON public.admin_notifications;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.product_downloads;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.purchases;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.product_views;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.profile_views;

-- admin_notifications: Only admins can insert
CREATE POLICY "Only admins can insert notifications"
ON public.admin_notifications
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

-- product_downloads: User can only record their own downloads
CREATE POLICY "Users can insert their own downloads"
ON public.product_downloads
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id::text);

-- purchases: Buyer must match the authenticated user
CREATE POLICY "Users can only create purchases for themselves"
ON public.purchases
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.id = buyer_id
  )
);

-- product_views: Allow all inserts (rate limiting handled by trigger)
-- But require valid product_id to prevent garbage data
CREATE POLICY "Anyone can insert product views for valid products"
ON public.product_views
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.products
    WHERE products.id = product_id
    AND products.status = 'published'
  )
);

-- profile_views: Allow all inserts (rate limiting handled by trigger)
-- But require valid profile_id to prevent garbage data
CREATE POLICY "Anyone can insert profile views for valid profiles"
ON public.profile_views
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = profile_id
  )
);

-- =============================================
-- FIX 2: Convert SECURITY DEFINER views to SECURITY INVOKER
-- and add proper base table SELECT policies
-- =============================================

-- Add SELECT policy on profiles for anonymous access to public creator/editor profiles
-- This allows SECURITY INVOKER views to work without exposing all data
DROP POLICY IF EXISTS "Public can view creator and editor profiles" ON public.profiles;
CREATE POLICY "Public can view creator and editor profiles"
ON public.profiles
FOR SELECT
TO anon
USING (
  (is_creator = true OR is_editor = true)
  AND suspended IS NOT true
);

-- Add SELECT policy on products for anonymous access to published products
DROP POLICY IF EXISTS "Anyone can view published products" ON public.products;
CREATE POLICY "Anyone can view published products"
ON public.products
FOR SELECT
TO anon, authenticated
USING (status = 'published');

-- Drop and recreate views with SECURITY INVOKER
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
WITH (security_invoker = true)
AS SELECT
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
FROM public.profiles
WHERE (is_creator = true OR is_editor = true)
  AND suspended IS NOT true;

DROP VIEW IF EXISTS public.public_identities;
CREATE VIEW public.public_identities
WITH (security_invoker = true)
AS SELECT
  id,
  user_id,
  username,
  full_name,
  avatar_url,
  verified,
  is_creator,
  is_editor
FROM public.profiles
WHERE (is_creator = true OR is_editor = true)
  AND suspended IS NOT true;

DROP VIEW IF EXISTS public.public_products;
CREATE VIEW public.public_products
WITH (security_invoker = true)
AS SELECT
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
  subscription_access,
  tags,
  featured,
  status,
  created_at,
  updated_at
FROM public.products
WHERE status = 'published';

-- Grant SELECT on views to anon and authenticated
GRANT SELECT ON public.public_profiles TO anon, authenticated;
GRANT SELECT ON public.public_identities TO anon, authenticated;
GRANT SELECT ON public.public_products TO anon, authenticated;