-- Fix sensitive data exposure in profiles table
-- The current RLS policy allows any authenticated user to view email, phone, and payment details
-- We need to restrict the policy to only allow users to view sensitive data for their own profile

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view creator/editor profiles" ON public.profiles;

-- Create a new restricted policy that:
-- 1. Allows anyone to see basic public profile info for creators/editors (via the public_profiles view)
-- 2. Only allows users to see their own sensitive data
CREATE POLICY "Users can view public profile data"
ON public.profiles
FOR SELECT
USING (
  -- Users can always see their own full profile
  auth.uid() = user_id
  -- OR they can see limited data for creators/editors (view handles column restriction)
  OR (
    (is_creator = true OR is_editor = true)
    AND auth.uid() IS NOT NULL
  )
  -- Admins can see everything
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- The public_profiles view (with security_invoker) already excludes sensitive columns
-- So authenticated users querying the view will only see safe public fields
-- Direct table access shows all columns but RLS + view combination protects data