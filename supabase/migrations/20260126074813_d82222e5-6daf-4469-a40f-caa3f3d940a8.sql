-- CRITICAL FIX: Ensure new users are properly synced to public_identities_cache
-- BULLETPROOF solution with fallback to profiles table

-- 1. Drop and recreate the safe_public_identities view with fallback to profiles table
DROP VIEW IF EXISTS public.safe_public_identities;

CREATE VIEW public.safe_public_identities 
WITH (security_invoker=on) AS
SELECT 
  COALESCE(pic.id, p.id) as id,
  COALESCE(pic.user_id, p.user_id) as user_id,
  COALESCE(pic.username, p.username) as username,
  COALESCE(pic.full_name, p.full_name) as full_name,
  COALESCE(pic.avatar_url, p.avatar_url) as avatar_url,
  COALESCE(pic.verified, p.verified) as verified,
  COALESCE(pic.is_creator, p.is_creator) as is_creator,
  COALESCE(pic.is_editor, p.is_editor) as is_editor,
  COALESCE(pic.is_owner, 
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.user_id AND ur.role = 'owner')
  ) as is_owner
FROM public.profiles p
LEFT JOIN public.public_identities_cache pic ON pic.id = p.id;

-- 2. Ensure the sync trigger exists and fires on INSERT, UPDATE, and DELETE
DROP TRIGGER IF EXISTS sync_profiles_to_cache ON public.profiles;

CREATE TRIGGER sync_profiles_to_cache
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_public_identities_cache();

DROP TRIGGER IF EXISTS delete_profiles_from_cache ON public.profiles;

CREATE TRIGGER delete_profiles_from_cache
  AFTER DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_public_identities_cache();

-- 3. Backfill any missing entries in the cache
INSERT INTO public.public_identities_cache (
  id,
  user_id,
  username,
  full_name,
  avatar_url,
  verified,
  is_creator,
  is_editor,
  is_owner,
  updated_at
)
SELECT 
  p.id,
  p.user_id,
  p.username,
  p.full_name,
  p.avatar_url,
  p.verified,
  p.is_creator,
  p.is_editor,
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.user_id AND ur.role = 'owner') as is_owner,
  now()
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.public_identities_cache pic WHERE pic.id = p.id
)
ON CONFLICT (id) DO NOTHING;

-- 4. Grant necessary permissions
GRANT SELECT ON public.safe_public_identities TO anon, authenticated;
GRANT SELECT ON public.public_identities_cache TO anon, authenticated;