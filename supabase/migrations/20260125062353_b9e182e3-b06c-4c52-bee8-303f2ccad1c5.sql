-- Fix: Convert public_identities view to security invoker pattern

-- Step 1: Drop the security definer view
DROP VIEW IF EXISTS public.public_identities;

-- Step 2: Update the cache table policy to allow SELECT for the view to work
-- The cache table only contains non-sensitive data (no emails, no passwords)
DROP POLICY IF EXISTS "No direct public access to identities cache" ON public.public_identities_cache;

-- Allow public read on cache table since it only contains public profile info
-- (username, avatar, verified status - no PII like emails)
CREATE POLICY "Anyone can view public identities cache"
ON public.public_identities_cache
FOR SELECT
USING (true);

-- Step 3: Recreate view with security_invoker = on
CREATE VIEW public.public_identities
WITH (security_invoker = on) AS
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
-- Note: updated_at is excluded to prevent activity tracking

-- Step 4: Grant SELECT on the view
GRANT SELECT ON public.public_identities TO anon;
GRANT SELECT ON public.public_identities TO authenticated;