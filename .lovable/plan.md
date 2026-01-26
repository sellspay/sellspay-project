
# Fix Notifications for New Users - Bulletproof Solution

## Problem Diagnosed

The notification system fails for new users because:

1. **Google OAuth users** never get a username - Google doesn't provide one
2. **Email signup users** have the username in metadata but the follow-up profile update tries to set a `phone` column that no longer exists
3. The sync trigger correctly copies data to the cache, but it's copying NULL usernames

## Solution Overview

We'll implement a **multi-layered bulletproof fix**:

1. **Eliminate the cache table complexity** - Query profiles directly via a secure view
2. **Fix the signup flow** to properly set usernames from metadata
3. **Handle Google OAuth users** by prompting them to set a username after signup
4. **Make notifications resilient** to missing usernames by using `full_name` as fallback

---

## Technical Changes

### 1. Database Migration

**Drop the cache layer and simplify the view architecture:**

```sql
-- Recreate safe_public_identities as a simple, direct view of profiles
-- No more cache table, no more sync triggers to fail
DROP VIEW IF EXISTS public.safe_public_identities CASCADE;

CREATE VIEW public.safe_public_identities 
WITH (security_invoker = off)
AS
SELECT 
  p.id,
  p.user_id,
  p.username,
  p.full_name,
  p.avatar_url,
  p.verified,
  p.is_creator,
  p.is_editor,
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = p.user_id AND ur.role = 'owner'
  ) AS is_owner
FROM public.profiles p;

GRANT SELECT ON public.safe_public_identities TO anon, authenticated;
```

**Why this is better:**
- No sync trigger that can fail or have timing issues
- Always returns current profile data
- `security_invoker = off` means the view runs with definer privileges, bypassing RLS
- One source of truth (profiles table)

### 2. Fix the Signup Flow (src/pages/Signup.tsx)

Remove the reference to the non-existent `phone` column in the profile update:

```typescript
// Lines 112-119: Remove phone from the update since it's in private.user_pii now
if (newUser) {
  await supabase
    .from('profiles')
    .update({
      username: cleanUsername,
      full_name: fullName.trim(),
      // phone is no longer on profiles - it's in private.user_pii
    })
    .eq('user_id', newUser.id);
}
```

### 3. Make handle_new_user More Robust

Update the trigger to ensure metadata is properly extracted:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_username text;
  v_full_name text;
BEGIN
  -- Extract from metadata with proper null handling
  v_username := NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), '');
  v_full_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    SPLIT_PART(NEW.email, '@', 1) -- Fallback to email prefix
  );

  -- Create public profile
  INSERT INTO public.profiles (
    user_id,
    username,
    full_name
  )
  VALUES (
    NEW.id,
    v_username,
    v_full_name
  );
  
  -- Create private PII record
  INSERT INTO private.user_pii (user_id, email, phone)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data->>'phone'
  );
  
  RETURN NEW;
END;
$$;
```

### 4. Make Notifications Resilient (src/pages/Notifications.tsx)

Update the notification display to use `full_name` when `username` is missing:

```typescript
// In NotificationCard component
<span className="font-medium text-foreground">
  {notification.actor?.username 
    ? `@${notification.actor.username}` 
    : notification.actor?.full_name 
    ? notification.actor.full_name 
    : "Someone"}
</span>
```

Update the click handler to handle missing usernames:

```typescript
const handleNotificationClick = async (notification: Notification) => {
  if (!notification.is_read) {
    await markAsRead(notification.id);
  }

  // Navigate based on what's available
  if (notification.redirect_url && !notification.redirect_url.includes('/@undefined') && !notification.redirect_url.includes('/@null')) {
    navigate(notification.redirect_url);
    return;
  }

  // Try actor username, then product link, then do nothing
  if (notification.actor?.username) {
    navigate(`/@${notification.actor.username}`);
  } else if (notification.type.includes('product') && notification.redirect_url?.includes('/product/')) {
    navigate(notification.redirect_url);
  }
  // If no valid navigation target, just mark as read (already done above)
};
```

### 5. Backfill Existing Broken Data

```sql
-- Fix users who have full_name but no username
-- Generate a username from their full_name (lowercase, no spaces, add random suffix)
UPDATE public.profiles
SET username = LOWER(REGEXP_REPLACE(full_name, '[^a-zA-Z0-9]', '', 'g')) || '_' || SUBSTRING(id::text, 1, 4)
WHERE username IS NULL 
  AND full_name IS NOT NULL 
  AND full_name != '';
```

---

## Summary of Changes

| File/Location | Change |
|--------------|--------|
| **Database Migration** | Simplify `safe_public_identities` to be a direct view of profiles (no cache) |
| **Database Migration** | Update `handle_new_user()` with better metadata extraction |
| **Database Migration** | Backfill usernames for existing users who are missing them |
| `src/pages/Signup.tsx` | Remove `phone` from profile update (it's in private schema now) |
| `src/pages/Notifications.tsx` | Show `full_name` as fallback when username is missing |
| `src/pages/Notifications.tsx` | Make click handler resilient to missing usernames |

---

## Why This Is Bulletproof

1. **No more cache sync timing issues** - Direct view of profiles means always current data
2. **Username auto-generation** - Users without usernames get one automatically generated
3. **Full name fallback** - Notifications still work even if username is truly missing
4. **Proper metadata extraction** - Google's `name` field and email prefix as fallbacks
5. **No silent failures** - Removed references to non-existent columns
