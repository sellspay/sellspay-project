-- Fix: Restrict direct access to public_identities_cache table
-- The public_identities VIEW (which excludes updated_at) should be used instead

-- Step 1: Drop the overly permissive policy on the cache table
DROP POLICY IF EXISTS "Public can read identities cache" ON public.public_identities_cache;
DROP POLICY IF EXISTS "Anyone can view public identities cache" ON public.public_identities_cache;

-- Step 2: Create a restrictive policy - only allow access via the view mechanism
-- The trigger still needs service role access to sync, but direct queries are blocked
CREATE POLICY "No direct public access to identities cache"
ON public.public_identities_cache
FOR SELECT
USING (false);

-- Step 3: Ensure the public_identities view exists and excludes sensitive fields
-- First check if it exists, if not create it
DROP VIEW IF EXISTS public.public_identities;

CREATE VIEW public.public_identities
WITH (security_invoker = off) AS
SELECT 
  id,
  user_id,
  username,
  full_name,
  avatar_url,
  verified,
  is_creator,
  is_editor
FROM public.public_identities_cache;
-- Note: updated_at is intentionally excluded to prevent activity tracking

-- Step 4: Grant SELECT on the view to anon and authenticated
GRANT SELECT ON public.public_identities TO anon;
GRANT SELECT ON public.public_identities TO authenticated;