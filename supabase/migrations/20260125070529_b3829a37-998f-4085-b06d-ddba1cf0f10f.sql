-- Fix security issue: Lock down profiles table to prevent PII exposure
-- The public_profiles/public_identities views (SECURITY DEFINER) will still work for public access
-- but direct queries to profiles table will no longer expose emails, phones, stripe IDs

-- Drop the overly permissive policy that exposes all columns for creators/editors
DROP POLICY IF EXISTS "Users can view public profile data" ON public.profiles;

-- Create a strict policy: users can ONLY see their own profile directly
-- Public data access must go through the safe views that filter sensitive columns
CREATE POLICY "Users can only view their own profile"
ON public.profiles FOR SELECT
USING (
  auth.uid() = user_id
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Note: The public_profiles, public_identities views are SECURITY DEFINER by design
-- They safely expose only non-sensitive columns (username, avatar, bio, etc.)
-- and filter for is_creator=true OR is_editor=true
-- This is the correct pattern for public profile visibility