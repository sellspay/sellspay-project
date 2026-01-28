
-- Drop and recreate the get_home_stats function with total downloads
DROP FUNCTION IF EXISTS public.get_home_stats();

CREATE OR REPLACE FUNCTION public.get_home_stats()
RETURNS TABLE(
  verified_creators bigint,
  verified_sellers bigint,
  premium_products bigint,
  community_members bigint,
  total_downloads bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    (SELECT COUNT(*) FROM public.profiles WHERE is_creator = true AND verified = true) AS verified_creators,
    (SELECT COUNT(*) FROM public.profiles WHERE is_seller = true) AS verified_sellers,
    (SELECT COUNT(*) FROM public.products WHERE status = 'published') AS premium_products,
    (SELECT COUNT(*) FROM public.profiles) AS community_members,
    (SELECT COUNT(*) FROM public.product_downloads) AS total_downloads;
$$;
