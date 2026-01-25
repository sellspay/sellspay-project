-- =============================================
-- FIX 1: Profiles table - Remove policy exposing all columns to authenticated users
-- =============================================

-- Drop the overly permissive policy that exposes email, phone, etc.
DROP POLICY IF EXISTS "Authenticated users can view creator and editor profiles" ON public.profiles;

-- The public_profiles view (already exists) should be used for public profile viewing
-- Users should query public_profiles instead of profiles table directly

-- =============================================
-- FIX 2: Purchases table - Add explicit isolation verification
-- =============================================

-- Drop existing policies and recreate with stricter checks
DROP POLICY IF EXISTS "Creators can view purchases of their products" ON public.purchases;
DROP POLICY IF EXISTS "Buyers can view their own purchases" ON public.purchases;

-- Recreate with more explicit isolation
CREATE POLICY "Buyers can only view their own purchases"
ON public.purchases FOR SELECT
USING (
  buyer_id = (
    SELECT id FROM public.profiles 
    WHERE user_id = auth.uid() 
    LIMIT 1
  )
);

CREATE POLICY "Creators can only view purchases of their own products"
ON public.purchases FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    JOIN public.profiles pr ON p.creator_id = pr.id
    WHERE p.id = purchases.product_id
    AND pr.user_id = auth.uid()
  )
);

-- Add admin access for dispute resolution
CREATE POLICY "Admins can view all purchases"
ON public.purchases FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- FIX 3: Editor bookings table - Strict isolation
-- =============================================

-- Drop existing policies and recreate
DROP POLICY IF EXISTS "Buyers can view their bookings" ON public.editor_bookings;
DROP POLICY IF EXISTS "Editors can view their bookings" ON public.editor_bookings;

-- Recreate with explicit isolation
CREATE POLICY "Buyers can only view their own bookings"
ON public.editor_bookings FOR SELECT
USING (
  buyer_id = (
    SELECT id FROM public.profiles 
    WHERE user_id = auth.uid() 
    LIMIT 1
  )
);

CREATE POLICY "Editors can only view their own bookings"
ON public.editor_bookings FOR SELECT
USING (
  editor_id = (
    SELECT id FROM public.profiles 
    WHERE user_id = auth.uid() 
    LIMIT 1
  )
);

-- Add admin access for dispute resolution
CREATE POLICY "Admins can view all bookings"
ON public.editor_bookings FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admin can update bookings for dispute resolution
CREATE POLICY "Admins can update bookings"
ON public.editor_bookings FOR UPDATE
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));