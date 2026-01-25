-- =====================================================
-- Clean up ALL old permissive policies on user_roles
-- =====================================================

-- Drop all old policies that expose roles publicly
DROP POLICY IF EXISTS "Anyone can check admin status for public display" ON public.user_roles;
DROP POLICY IF EXISTS "Public can check owner role only" ON public.user_roles;
DROP POLICY IF EXISTS "Public can view owner role" ON public.user_roles;
DROP POLICY IF EXISTS "Public can view owner role for badges" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- Keep only the strict policies:
-- 1. "Users can read their own roles" (already created - lets auth users see their own roles)
-- 2. "Admins can manage roles" (already exists - lets admins manage)

-- =====================================================
-- Clean up ALL old permissive policies on public_identities_cache  
-- =====================================================

-- Drop all old policies that expose the cache publicly
DROP POLICY IF EXISTS "Anyone can read public identities cache" ON public.public_identities_cache;
DROP POLICY IF EXISTS "Anyone can view public identities cache" ON public.public_identities_cache;
DROP POLICY IF EXISTS "Anyone can view public identity cache" ON public.public_identities_cache;
DROP POLICY IF EXISTS "Authenticated users can read identity cache" ON public.public_identities_cache;

-- Keep only:
-- 1. "No direct access to identities cache" (USING false - blocks all reads)
-- 2. "No direct inserts to identity cache" 
-- 3. "No direct updates to identity cache"
-- 4. "No direct deletes from identity cache"

-- The safe_public_identities view now provides controlled public access