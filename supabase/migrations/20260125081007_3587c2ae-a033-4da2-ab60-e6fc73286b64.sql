
-- =====================================================
-- COMPREHENSIVE SECURITY FIX: Separate Public & Private Data
-- =====================================================

-- Step 1: Drop existing views to recreate them cleanly
DROP VIEW IF EXISTS public.public_profiles CASCADE;
DROP VIEW IF EXISTS public.public_identities CASCADE;
DROP VIEW IF EXISTS public.public_products CASCADE;
DROP VIEW IF EXISTS public.safe_public_identities CASCADE;

-- =====================================================
-- Step 2: Create CLEAN public views with ONLY non-sensitive data
-- These views include is_owner computed field
-- =====================================================

-- Public Profiles View - ONLY non-sensitive fields + is_owner
CREATE VIEW public.public_profiles 
WITH (security_barrier = true, security_invoker = false) AS
SELECT 
  p.id,
  p.user_id,
  p.username,
  p.full_name,
  p.avatar_url,
  p.banner_url,
  p.background_url,
  p.bio,
  p.website,
  p.social_links,
  p.verified,
  p.is_creator,
  p.is_editor,
  p.show_recent_uploads,
  p.global_font,
  p.global_custom_font,
  p.editor_about,
  p.editor_city,
  p.editor_country,
  p.editor_hourly_rate_cents,
  p.editor_languages,
  p.editor_services,
  p.editor_social_links,
  p.created_at,
  p.updated_at,
  -- Computed is_owner field - checks user_roles table
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = p.user_id AND ur.role = 'owner'
  ) AS is_owner
FROM public.profiles p;

-- Public Identities View - minimal public info + is_owner
CREATE VIEW public.public_identities 
WITH (security_barrier = true, security_invoker = false) AS
SELECT 
  p.id,
  p.user_id,
  p.username,
  p.full_name,
  p.avatar_url,
  p.verified,
  p.is_creator,
  p.is_editor,
  -- Computed is_owner field
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = p.user_id AND ur.role = 'owner'
  ) AS is_owner
FROM public.profiles p;

-- Safe Public Identities - same as public_identities but without user_id
CREATE VIEW public.safe_public_identities 
WITH (security_barrier = true, security_invoker = false) AS
SELECT 
  p.id,
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

-- Public Products View - ONLY non-sensitive fields
CREATE VIEW public.public_products 
WITH (security_barrier = true, security_invoker = false) AS
SELECT 
  pr.id,
  pr.name,
  pr.description,
  pr.excerpt,
  pr.cover_image_url,
  pr.preview_video_url,
  pr.youtube_url,
  pr.price_cents,
  pr.currency,
  pr.pricing_type,
  pr.product_type,
  pr.status,
  pr.tags,
  pr.creator_id,
  pr.slug,
  pr.featured,
  pr.subscription_access,
  pr.duration_label,
  pr.created_at,
  pr.updated_at
  -- EXCLUDED: download_url, original_filename, attachments, benefits, locked, created_by
FROM public.products pr
WHERE pr.status = 'published';

-- =====================================================
-- Step 3: Grant SELECT on public views to all users
-- =====================================================
GRANT SELECT ON public.public_profiles TO anon, authenticated;
GRANT SELECT ON public.public_identities TO anon, authenticated;
GRANT SELECT ON public.safe_public_identities TO anon, authenticated;
GRANT SELECT ON public.public_products TO anon, authenticated;

-- =====================================================
-- Step 4: Update public_identities_cache to include is_owner
-- =====================================================
ALTER TABLE public.public_identities_cache 
ADD COLUMN IF NOT EXISTS is_owner boolean DEFAULT false;

-- Update existing cache entries
UPDATE public.public_identities_cache pic
SET is_owner = EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = pic.user_id AND ur.role = 'owner'
);

-- =====================================================
-- Step 5: Update the sync trigger to include is_owner
-- =====================================================
CREATE OR REPLACE FUNCTION public.sync_public_identities_cache()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.public_identities_cache (
    id,
    user_id,
    username,
    full_name,
    avatar_url,
    verified,
    is_creator,
    is_editor,
    is_owner,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.user_id,
    NEW.username,
    NEW.full_name,
    NEW.avatar_url,
    NEW.verified,
    NEW.is_creator,
    NEW.is_editor,
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = NEW.user_id AND ur.role = 'owner'),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    verified = EXCLUDED.verified,
    is_creator = EXCLUDED.is_creator,
    is_editor = EXCLUDED.is_editor,
    is_owner = EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = NEW.user_id AND ur.role = 'owner'),
    updated_at = now();

  RETURN NEW;
END;
$$;

-- =====================================================
-- Step 6: Lock down sensitive tables with strict RLS
-- =====================================================

-- PROFILES TABLE: Users can only read/write their OWN row
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create strict policies - NO public access to base table
CREATE POLICY "Users can view only their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update only their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert only their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- SELLER_PAYMENT_CONFIG TABLE: Strict owner-only access
DROP POLICY IF EXISTS "Users can view their own payment config" ON public.seller_payment_config;
DROP POLICY IF EXISTS "Users can update their own payment config" ON public.seller_payment_config;
DROP POLICY IF EXISTS "Users can insert their own payment config" ON public.seller_payment_config;

CREATE POLICY "Users can view only their own payment config"
ON public.seller_payment_config FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update only their own payment config"
ON public.seller_payment_config FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert only their own payment config"
ON public.seller_payment_config FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- VERIFICATION_CODES TABLE: Strict owner-only access
DROP POLICY IF EXISTS "Users can view their own verification codes" ON public.verification_codes;
DROP POLICY IF EXISTS "Users can insert their own verification codes" ON public.verification_codes;
DROP POLICY IF EXISTS "Users can delete their own verification codes" ON public.verification_codes;

CREATE POLICY "Users can view only their own verification codes"
ON public.verification_codes FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert only their own verification codes"
ON public.verification_codes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete only their own verification codes"
ON public.verification_codes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- PURCHASES TABLE: Buyers can see their purchases, creators can see sales of their products
DROP POLICY IF EXISTS "Buyers can view their own purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can view purchases as buyer" ON public.purchases;
DROP POLICY IF EXISTS "Users can view purchases as creator" ON public.purchases;

CREATE POLICY "Buyers can view their own purchases"
ON public.purchases FOR SELECT
TO authenticated
USING (
  buyer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Creators can view sales of their products"
ON public.purchases FOR SELECT
TO authenticated
USING (
  product_id IN (
    SELECT id FROM public.products 
    WHERE creator_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- USER_ROLES TABLE: Keep existing policy for owner role visibility
-- But ensure users cannot modify roles
DROP POLICY IF EXISTS "Anyone can read owner roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Allow reading owner roles publicly (for badge display)
CREATE POLICY "Anyone can read owner roles"
ON public.user_roles FOR SELECT
USING (role = 'owner');

-- Authenticated users can see their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Ensure no INSERT/UPDATE/DELETE for regular users
DROP POLICY IF EXISTS "No user modifications to roles" ON public.user_roles;
-- (Admin modifications would be done via service role, not through RLS)
