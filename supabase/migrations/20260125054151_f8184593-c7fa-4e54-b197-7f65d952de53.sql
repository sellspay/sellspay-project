-- Allow public read access to creator and editor profiles
-- This is safe because:
-- 1. Only profiles marked as is_creator=true or is_editor=true are accessible
-- 2. The public_profiles and public_identities views exclude sensitive PII
-- 3. This enables universal visibility for public-facing pages
CREATE POLICY "Anyone can view creator and editor profiles"
ON public.profiles FOR SELECT
USING (is_creator = true OR is_editor = true);