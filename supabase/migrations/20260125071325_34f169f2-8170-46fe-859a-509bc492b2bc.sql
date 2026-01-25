-- Fix remaining 'always true' INSERT policies

-- 1. admin_notifications: Drop old policy and keep only the proper one
DROP POLICY IF EXISTS "Authenticated users can create admin notifications" ON public.admin_notifications;

-- 2. product_downloads: Drop the edge function policy (we replaced it)
DROP POLICY IF EXISTS "Edge functions can insert downloads" ON public.product_downloads;

-- 3. purchases: Drop the system insert policy (we replaced it)
DROP POLICY IF EXISTS "System can insert purchases" ON public.purchases;

-- 4. product_views: Drop old policy (we replaced it)
DROP POLICY IF EXISTS "Anyone can create product views" ON public.product_views;

-- 5. profile_views: Drop old policy (we replaced it)
DROP POLICY IF EXISTS "Anyone can create profile views" ON public.profile_views;