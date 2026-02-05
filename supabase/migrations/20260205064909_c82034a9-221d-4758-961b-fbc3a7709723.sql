-- Drop the overly permissive insert policy
DROP POLICY IF EXISTS "Service role can insert ai_runs" ON public.ai_runs;

-- Edge functions using service role bypass RLS anyway, so we don't need an INSERT policy for them
-- The existing SELECT and UPDATE policies for users are sufficient