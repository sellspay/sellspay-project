-- Fix user_roles table to be more restrictive
-- Only allow checking 'owner' role publicly (for verified badge)
-- Restrict direct access to admin/moderator roles

-- Drop existing policies on user_roles
DROP POLICY IF EXISTS "Anyone can check owner role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create restrictive policies
-- Users can only view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow public to check ONLY owner role (needed for verified badge display)
-- This is safe because owner status is meant to be public
CREATE POLICY "Public can check owner role only"
ON public.user_roles
FOR SELECT
TO anon
USING (role = 'owner');