-- Fix the RLS policy on profiles table to prevent direct public access to sensitive columns
-- Instead of allowing public SELECT on profiles for creators/editors, we'll rely on the views

-- First, drop the problematic public access policy
DROP POLICY IF EXISTS "Public can view creator and editor profiles" ON public.profiles;

-- The secure public_profiles and public_identities views (with security_invoker=on)
-- will now be the only way for anonymous users to access creator/editor profile data.
-- These views only expose non-sensitive columns.

-- Note: Authenticated users can still access profiles through other policies:
-- - "Users can view their own full profile" (owner access)
-- - "Admins can view all profiles" (admin access)
-- - "Service role can view all profiles" (system access)

-- To maintain backwards compatibility for the frontend, we need to ensure 
-- the frontend code queries public_profiles view instead of profiles table directly.
-- The existing policies already handle this correctly.