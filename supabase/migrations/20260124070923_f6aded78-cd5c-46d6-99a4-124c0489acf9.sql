-- Create an RPC for homepage stats so anonymous visitors can see accurate counts
CREATE OR REPLACE FUNCTION public.get_home_stats()
RETURNS TABLE (
  verified_creators bigint,
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
    (SELECT COUNT(*) FROM public.products WHERE status = 'published') AS premium_products,
    (SELECT COUNT(*) FROM public.profiles) AS community_members;
$$;

-- Allow anonymous + authenticated clients to call it
GRANT EXECUTE ON FUNCTION public.get_home_stats() TO anon, authenticated;