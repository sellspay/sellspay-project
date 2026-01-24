-- Drop existing function first since return type is changing
DROP FUNCTION IF EXISTS public.get_home_stats();

-- Recreate with verified sellers included
CREATE FUNCTION public.get_home_stats()
RETURNS TABLE (
  verified_creators bigint,
  verified_sellers bigint,
  premium_products bigint,
  community_members bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(*) FROM public.profiles WHERE is_creator = true AND verified = true) AS verified_creators,
    (SELECT COUNT(*) FROM public.profiles WHERE is_seller = true) AS verified_sellers,
    (SELECT COUNT(*) FROM public.products WHERE status = 'published') AS premium_products,
    (SELECT COUNT(*) FROM public.profiles) AS community_members;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION public.get_home_stats() TO anon, authenticated;