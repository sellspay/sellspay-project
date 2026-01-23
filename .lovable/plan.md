

# Implementation Plan: Product Attachments, Auth Improvements, and OAuth

## Overview
This plan covers four main features:
1. **Product Attachments Card** - Display attachments with file info below the creator card
2. **Real-time Username/Email Validation** - Debounced availability checking during signup
3. **Login with Username or Email** - Flexible credential entry
4. **OAuth Providers** - Social login integration

---

## 1. Product Attachments Card

### Current State
The ProductDetail page already has an attachments section (lines 1268-1294), but it's positioned below comments. The request is to move this to a dedicated card below the "View Profile" card in the sidebar.

### Changes Required

**Modify: `src/pages/ProductDetail.tsx`**

Create a new "Attachments" card in the sidebar section (after line 1363) with:
- Purple-themed styling matching the existing theme
- File icon for each attachment
- File name (truncated if long)
- File size (formatted: KB, MB, etc.)
- Lock icon indicating access required (for non-owners/non-purchasers)
- Unlocked download button for users with access

**Card Layout:**
```text
┌────────────────────────────────┐
│  📂 Attachments                │
├────────────────────────────────┤
│  ┌───┐  Premium_Pack.zip       │
│  │ 📄 │ 125.4 MB         🔒   │
│  └───┘                         │
│  ┌───┐  Bonus_Assets.rar       │
│  │ 📄 │ 45.2 MB          🔒   │
│  └───┘                         │
└────────────────────────────────┘
```

---

## 2. Real-time Username/Email Validation

### Current State
- Username availability is checked only on form submit
- Email availability is checked only after Supabase signup fails
- No visual feedback during typing

### Changes Required

**Create: Database function `is_email_available`**
```sql
CREATE FUNCTION public.is_email_available(p_email text)
RETURNS boolean
```
Checks `auth.users` table for existing email (uses SECURITY DEFINER).

**Modify: `src/pages/Signup.tsx`**

Add real-time validation with debounce:
- Use `useDebounce` hook (already exists) with 500ms delay
- Show inline status indicators:
  - Spinner while checking
  - Green checkmark if available
  - Red X with message if taken
- Validate both username and email fields as user types
- Block form submission if either is unavailable

**UI Feedback:**
```text
Username: @cooluser ✓ Available
Email: test@email.com ✗ Already registered
```

---

## 3. Login with Username or Email

### Current State
- Login only accepts email format
- Uses `signInWithPassword({ email, password })`

### Changes Required

**Create: Database function `get_email_by_username`**
```sql
CREATE FUNCTION public.get_email_by_username(p_username text)
RETURNS text
```
Looks up email from profiles table by username (case-insensitive).

**Modify: `src/pages/Login.tsx`**

- Change input placeholder to "Email or Username"
- Update icon to `AtSign` (or keep `Mail`)
- Before calling `signIn`:
  1. Check if input contains `@` symbol
  2. If no `@`, treat as username and call `get_email_by_username` RPC
  3. Use returned email for authentication
  4. If username not found, show "Username not found" error

**Modify: `src/lib/auth.tsx`**

- Update `signIn` function signature to accept `emailOrUsername`
- Add logic to resolve username to email before auth

---

## 4. OAuth Providers

### Important Limitation
Based on Lovable Cloud capabilities, **only Google OAuth is currently supported**. Discord, Facebook, and Apple OAuth are NOT yet available in Lovable Cloud.

### Changes Required for Google OAuth

**Modify: `src/pages/Login.tsx` and `src/pages/Signup.tsx`**

Add social login buttons:
- Google Sign In button with Google logo
- Disabled placeholder buttons for Discord, Facebook, Apple (showing "Coming Soon")

**Modify: `src/lib/auth.tsx`**

Add `signInWithGoogle` function:
```typescript
const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });
  return { error };
};
```

**User Action Required:**
- Configure Google OAuth in Cloud dashboard
- Set up Google Cloud Console OAuth client

---

## Technical Details

### Database Functions to Create

```sql
-- Function to check if email is available
CREATE OR REPLACE FUNCTION public.is_email_available(p_email text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF p_email IS NULL OR length(p_email) = 0 THEN
    RETURN false;
  END IF;
  
  RETURN NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE LOWER(email) = LOWER(p_email)
  );
END;
$$;

-- Function to get email by username
CREATE OR REPLACE FUNCTION public.get_email_by_username(p_username text)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_email text;
BEGIN
  IF p_username IS NULL OR length(p_username) = 0 THEN
    RETURN NULL;
  END IF;
  
  SELECT email INTO user_email
  FROM public.profiles
  WHERE LOWER(username) = LOWER(p_username)
  LIMIT 1;
  
  RETURN user_email;
END;
$$;
```

### File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/pages/ProductDetail.tsx` | Modify | Move attachments to sidebar card with purple theme |
| `src/pages/Signup.tsx` | Modify | Add debounced real-time validation for username/email |
| `src/pages/Login.tsx` | Modify | Support username login, add Google OAuth button |
| `src/lib/auth.tsx` | Modify | Add `signInWithGoogle`, update `signIn` for username |
| Database migration | Create | Add `is_email_available` and `get_email_by_username` functions |

### Signup Validation Flow

```text
┌─────────────────────────────────────────────────┐
│                 User Types                      │
└─────────────────────────────────────────────────┘
                      │
                      ▼
         ┌─────────────────────┐
         │ Debounce 500ms      │
         └─────────────────────┘
                      │
                      ▼
         ┌─────────────────────┐
         │ Call RPC function   │
         │ is_username_available│
         │ is_email_available  │
         └─────────────────────┘
                      │
                      ▼
    ┌─────────────────┴─────────────────┐
    │                                   │
    ▼                                   ▼
┌───────────┐                    ┌───────────┐
│ Available │                    │   Taken   │
│    ✓      │                    │    ✗      │
└───────────┘                    └───────────┘
```

### Login Flow with Username Support

```text
┌─────────────────────────────────────────────────┐
│          User enters credential                 │
└─────────────────────────────────────────────────┘
                      │
                      ▼
         ┌─────────────────────┐
         │ Contains @ symbol?  │
         └─────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
   ┌─────────┐               ┌─────────────┐
   │  Email  │               │  Username   │
   │  Format │               │   Format    │
   └─────────┘               └─────────────┘
        │                           │
        │                           ▼
        │                ┌────────────────────┐
        │                │ get_email_by_      │
        │                │ username RPC       │
        │                └────────────────────┘
        │                           │
        │                           ▼
        │                    ┌────────────┐
        │                    │ Get Email  │
        │                    └────────────┘
        │                           │
        └───────────────────────────┘
                      │
                      ▼
         ┌─────────────────────┐
         │ signInWithPassword  │
         │ (email, password)   │
         └─────────────────────┘
```

---

## Implementation Order

1. **Database Migration**
   - Create `is_email_available` function
   - Create `get_email_by_username` function

2. **ProductDetail Attachments Card**
   - Move attachments to sidebar
   - Apply purple theme styling
   - Add access control logic

3. **Signup Validation**
   - Add debounced username checking
   - Add debounced email checking
   - Add inline validation UI

4. **Login with Username**
   - Update login form to accept username
   - Add username resolution logic
   - Update error messages

5. **Google OAuth**
   - Add Google sign-in button to Login/Signup
   - Add `signInWithGoogle` to auth context
   - Provide instructions for Google Cloud setup

---

## OAuth Provider Status

| Provider | Status | Notes |
|----------|--------|-------|
| Google | Supported | Requires Google Cloud Console setup |
| Discord | Not Available | Lovable Cloud limitation |
| Facebook | Not Available | Lovable Cloud limitation |
| Apple | Not Available | Lovable Cloud limitation |

The non-supported providers will be shown as disabled buttons with "Coming Soon" labels, allowing for future expansion when they become available.

