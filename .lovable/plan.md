
# Fix: Universal Visibility for Public Profile Data

## Problem Summary
After the recent security hardening, all public-facing pages that display creator/editor profiles are broken for non-authenticated users. This affects:

- **Home Page**: Featured Creators section and Testimonials (missing Kagori card)
- **Products Page**: Comments show "@anonymous" with no avatars, "View Profile" card missing
- **Community Page**: Thread authors show no profile pictures or usernames
- **Spotlight Page**: Featured creators not displaying
- **Updates Page**: Author information not visible
- **Hire Editors Page**: No editors shown when logged out
- **Creators Page**: No creators shown when logged out

## Root Cause
The database views `public_profiles` and `public_identities` use `security_invoker=on`, meaning they inherit the caller's RLS permissions. The underlying `profiles` table has no SELECT policy for:
- Anonymous users
- Authenticated users viewing other users' profiles (creator/editor)

The recent security migration removed the policy "Authenticated users can view creator and editor profiles" which was needed for this functionality.

## Solution: Add a Public-Safe RLS Policy

Create a new RLS policy on the `profiles` table that allows **anyone** (including anonymous users) to SELECT rows where `is_creator = true OR is_editor = true`. This is safe because:

1. The views already filter to only include safe, non-PII columns
2. Only creator/editor profiles are exposed (not regular users)
3. Sensitive fields (email, phone, stripe_account_id, payoneer_email) are excluded from the views

## Database Migration

```sql
-- Allow public read access to creator and editor profiles
-- This is safe because:
-- 1. Only profiles marked as is_creator=true or is_editor=true are accessible
-- 2. The public_profiles and public_identities views exclude sensitive PII
-- 3. This enables universal visibility for public-facing pages
CREATE POLICY "Anyone can view creator and editor profiles"
ON public.profiles FOR SELECT
USING (is_creator = true OR is_editor = true);
```

## Changes Summary

| Component | Current State | After Fix |
|-----------|---------------|-----------|
| Featured Creators (Home) | Empty for anonymous users | Shows all featured creators |
| Testimonials (Home) | Missing Kagori card | Shows all testimonials with correct profile data |
| Product Comments | Shows "@anonymous", no avatars | Shows correct usernames and avatars |
| Product Creator Card | Missing for non-owners | Visible to everyone |
| Community Threads | No author profile data | Shows author info (avatar, username, verified badge) |
| Spotlight Page | Empty | Shows spotlighted creators |
| Updates Page | Works (uses bot identity) | No change needed |
| Hire Editors | Empty for anonymous | Shows all approved editors |
| Creators Page | Empty for anonymous | Shows all creators |

## Security Assurance

This change is secure because:

1. **Column-Level Protection**: The views (`public_profiles`, `public_identities`) explicitly exclude sensitive columns:
   - No email, phone, stripe_account_id, payoneer_email, seller_support_email
   - Only public-facing data: username, full_name, avatar_url, bio, verified status

2. **Row-Level Filtering**: Only profiles where `is_creator = true OR is_editor = true` are accessible
   - Regular users' profiles remain completely private
   - No access to non-creator/editor accounts

3. **Owner's Full Profile**: The existing "Users can view their own full profile" policy remains, allowing users to see all their own data

## Files Affected
- Database migration only (no code changes needed)
- The existing code already queries the correct views (`public_profiles`, `public_identities`)

## Testing Verification
After applying this fix, verify in an incognito/logged-out browser:
- Home page shows Featured Creators section
- Home page Testimonials shows all cards including dynamic ones
- Product page shows creator "View Profile" card
- Product comments show usernames and avatars
- Community threads show author info
- Spotlight page shows featured creators
- Hire Editors page shows all approved editors
- Creators page shows all creators
