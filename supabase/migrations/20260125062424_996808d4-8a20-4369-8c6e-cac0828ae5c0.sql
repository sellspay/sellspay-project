-- Clean up conflicting policies on public_identities_cache
-- Remove the blocking policy, keep only the allow policy since this table contains only public data

DROP POLICY IF EXISTS "No direct public access to identities cache" ON public.public_identities_cache;

-- The "Anyone can read public identities cache" policy remains and allows public read access
-- This is safe because the table only contains: id, user_id, username, full_name, avatar_url, verified, is_creator, is_editor
-- No sensitive data like emails or passwords are stored here