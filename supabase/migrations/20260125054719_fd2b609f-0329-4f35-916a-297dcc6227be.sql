-- Public-safe identity cache for displaying usernames/avatars everywhere (including anonymous visitors)
-- This avoids exposing PII from public.profiles while still allowing universal attribution.

CREATE TABLE IF NOT EXISTS public.public_identities_cache (
  id uuid PRIMARY KEY,
  user_id uuid UNIQUE NOT NULL,
  username text,
  full_name text,
  avatar_url text,
  verified boolean,
  is_creator boolean,
  is_editor boolean,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.public_identities_cache ENABLE ROW LEVEL SECURITY;

-- Universal read access (safe columns only)
DROP POLICY IF EXISTS "Anyone can read public identities cache" ON public.public_identities_cache;
CREATE POLICY "Anyone can read public identities cache"
ON public.public_identities_cache
FOR SELECT
USING (true);

-- Keep cache in sync with profiles (only copies non-sensitive columns)
CREATE OR REPLACE FUNCTION public.sync_public_identities_cache()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.public_identities_cache (
    id,
    user_id,
    username,
    full_name,
    avatar_url,
    verified,
    is_creator,
    is_editor,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.user_id,
    NEW.username,
    NEW.full_name,
    NEW.avatar_url,
    NEW.verified,
    NEW.is_creator,
    NEW.is_editor,
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    verified = EXCLUDED.verified,
    is_creator = EXCLUDED.is_creator,
    is_editor = EXCLUDED.is_editor,
    updated_at = now();

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_public_identities_cache()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.public_identities_cache WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_public_identities_cache ON public.profiles;
CREATE TRIGGER trg_sync_public_identities_cache
AFTER INSERT OR UPDATE OF user_id, username, full_name, avatar_url, verified, is_creator, is_editor
ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_public_identities_cache();

DROP TRIGGER IF EXISTS trg_delete_public_identities_cache ON public.profiles;
CREATE TRIGGER trg_delete_public_identities_cache
AFTER DELETE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.delete_public_identities_cache();

-- Backfill existing profiles
INSERT INTO public.public_identities_cache (id, user_id, username, full_name, avatar_url, verified, is_creator, is_editor, updated_at)
SELECT id, user_id, username, full_name, avatar_url, verified, is_creator, is_editor, now()
FROM public.profiles
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  verified = EXCLUDED.verified,
  is_creator = EXCLUDED.is_creator,
  is_editor = EXCLUDED.is_editor,
  updated_at = now();

-- Helpful for lookups by auth user id
CREATE INDEX IF NOT EXISTS idx_public_identities_cache_user_id
ON public.public_identities_cache (user_id);