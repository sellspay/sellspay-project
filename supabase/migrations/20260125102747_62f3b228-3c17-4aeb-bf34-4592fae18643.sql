
-- Step 1: Create trigger to sync public_identities_cache on profile changes
-- This was missing - the function existed but no trigger was attached!
DROP TRIGGER IF EXISTS sync_profiles_to_cache ON public.profiles;

CREATE TRIGGER sync_profiles_to_cache
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_public_identities_cache();

-- Step 2: Add trigger for deletes as well
DROP TRIGGER IF EXISTS delete_profiles_from_cache ON public.profiles;

CREATE TRIGGER delete_profiles_from_cache
  AFTER DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_public_identities_cache();

-- Step 3: Backfill all existing profiles to the cache
-- This ensures all current profiles (including those with usernames) are properly cached
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
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.user_id AND ur.role = 'owner'),
  now()
FROM public.profiles p
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  verified = EXCLUDED.verified,
  is_creator = EXCLUDED.is_creator,
  is_editor = EXCLUDED.is_editor,
  is_owner = EXCLUDED.is_owner,
  updated_at = now();
