-- Add explicit RLS policies to public_identities_cache table
-- This makes the security intentional and documented, not "missing"

-- Enable RLS on the table (if not already)
ALTER TABLE public.public_identities_cache ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read the cache (this is intentional - it only contains public display data)
CREATE POLICY "Anyone can view public identity cache"
ON public.public_identities_cache
FOR SELECT
USING (true);

-- Only system triggers can insert/update (no direct user access)
CREATE POLICY "No direct inserts to identity cache"
ON public.public_identities_cache
FOR INSERT
WITH CHECK (false);

CREATE POLICY "No direct updates to identity cache"
ON public.public_identities_cache
FOR UPDATE
USING (false);

CREATE POLICY "No direct deletes from identity cache"
ON public.public_identities_cache
FOR DELETE
USING (false);