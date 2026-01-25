-- Ensure anonymous users can access public views and cache tables
-- This fixes the "Unknown" display issue for unauthenticated visitors

-- Re-grant SELECT on public_profiles to anon (in case it was dropped)
GRANT SELECT ON public.public_profiles TO anon;
GRANT SELECT ON public.public_profiles TO authenticated;

-- Re-grant SELECT on public_identities to anon
GRANT SELECT ON public.public_identities TO anon;
GRANT SELECT ON public.public_identities TO authenticated;

-- Ensure public_identities_cache is accessible (with RLS already in place)
GRANT SELECT ON public.public_identities_cache TO anon;
GRANT SELECT ON public.public_identities_cache TO authenticated;