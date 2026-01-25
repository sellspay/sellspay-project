-- Remove the dangerous public SELECT policy that exposes sensitive PII
DROP POLICY IF EXISTS "Anyone can view creator and editor profiles" ON public.profiles;

-- Also drop the overly permissive service role policy (service role bypasses RLS anyway)
DROP POLICY IF EXISTS "Service role can view all profiles" ON public.profiles;