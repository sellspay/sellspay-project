-- Rate limiting for analytics tables to prevent abuse
-- Limits: 1 view per product/profile per viewer per hour (or per IP for anonymous)

-- Function to rate limit product_views inserts
CREATE OR REPLACE FUNCTION public.rate_limit_product_views()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count int;
BEGIN
  -- Check for recent views from same viewer (authenticated) or same referrer pattern (anonymous)
  IF NEW.viewer_id IS NOT NULL THEN
    -- Authenticated user: limit 1 view per product per hour
    SELECT COUNT(*) INTO recent_count
    FROM public.product_views
    WHERE product_id = NEW.product_id
      AND viewer_id = NEW.viewer_id
      AND created_at > now() - interval '1 hour';
  ELSE
    -- Anonymous: limit by product + referrer combo (basic fingerprint)
    SELECT COUNT(*) INTO recent_count
    FROM public.product_views
    WHERE product_id = NEW.product_id
      AND viewer_id IS NULL
      AND COALESCE(referrer_domain, '') = COALESCE(NEW.referrer_domain, '')
      AND COALESCE(country_code, '') = COALESCE(NEW.country_code, '')
      AND created_at > now() - interval '5 minutes';
  END IF;

  -- If already viewed recently, silently skip (don't error, just don't insert duplicate)
  IF recent_count > 0 THEN
    RETURN NULL; -- Prevents the insert
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rate_limit_product_views ON public.product_views;
CREATE TRIGGER trg_rate_limit_product_views
BEFORE INSERT ON public.product_views
FOR EACH ROW
EXECUTE FUNCTION public.rate_limit_product_views();

-- Function to rate limit profile_views inserts
CREATE OR REPLACE FUNCTION public.rate_limit_profile_views()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count int;
BEGIN
  -- Check for recent views from same viewer (authenticated) or same referrer pattern (anonymous)
  IF NEW.viewer_id IS NOT NULL THEN
    -- Authenticated user: limit 1 view per profile per hour
    SELECT COUNT(*) INTO recent_count
    FROM public.profile_views
    WHERE profile_id = NEW.profile_id
      AND viewer_id = NEW.viewer_id
      AND created_at > now() - interval '1 hour';
  ELSE
    -- Anonymous: limit by profile + referrer combo
    SELECT COUNT(*) INTO recent_count
    FROM public.profile_views
    WHERE profile_id = NEW.profile_id
      AND viewer_id IS NULL
      AND COALESCE(referrer_domain, '') = COALESCE(NEW.referrer_domain, '')
      AND COALESCE(country_code, '') = COALESCE(NEW.country_code, '')
      AND created_at > now() - interval '5 minutes';
  END IF;

  IF recent_count > 0 THEN
    RETURN NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rate_limit_profile_views ON public.profile_views;
CREATE TRIGGER trg_rate_limit_profile_views
BEFORE INSERT ON public.profile_views
FOR EACH ROW
EXECUTE FUNCTION public.rate_limit_profile_views();

-- Add indexes to speed up rate limit checks
CREATE INDEX IF NOT EXISTS idx_product_views_rate_limit 
ON public.product_views (product_id, viewer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_views_anon_rate_limit 
ON public.product_views (product_id, referrer_domain, country_code, created_at DESC) 
WHERE viewer_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_profile_views_rate_limit 
ON public.profile_views (profile_id, viewer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profile_views_anon_rate_limit 
ON public.profile_views (profile_id, referrer_domain, country_code, created_at DESC) 
WHERE viewer_id IS NULL;