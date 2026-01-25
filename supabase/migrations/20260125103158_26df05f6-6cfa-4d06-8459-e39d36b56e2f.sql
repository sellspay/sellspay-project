
-- Allow public SELECT on the identities cache so the views can read it
DROP POLICY IF EXISTS "No direct access to identities cache" ON public.public_identities_cache;

CREATE POLICY "Anyone can read identities cache"
  ON public.public_identities_cache
  FOR SELECT
  USING (true);
