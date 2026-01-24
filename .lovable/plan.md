

# Creator Application System with 2FA Implementation Plan

## Overview

This implementation adds a complete creator application flow that:
1. Prevents non-approved users from creating/selling products
2. Adds a "Become a Creator" button on user profiles
3. Implements a 4-step application wizard with 2FA requirement
4. Adds a "Creator Applications" tab in the admin dashboard for review

---

## Current State Analysis

- Users have an `is_creator` field in profiles (defaults to `false`)
- The `CreateProduct` page currently only checks if user is signed in, not if they're an approved creator
- Editor applications already exist with a similar flow (pending/approved/rejected with 14-day cooldown)
- Supabase Auth supports OTP via email using `signInWithOtp` and `verifyOtp` methods

---

## Implementation Details

### Part 1: Database Changes

**New table: `creator_applications`**
- `id` (uuid, primary key)
- `user_id` (uuid, references profiles.id)
- `full_name` (text)
- `country` (text)
- `state` (text)
- `languages` (text[])
- `social_links` (jsonb) - at least 1 required
- `product_types` (text[]) - what they want to sell (digital products, tutorials, courses, presets, etc.)
- `status` (text) - 'pending', 'approved', 'rejected'
- `created_at`, `reviewed_at`, `reviewed_by`

**Profile table updates:**
- Add `mfa_enabled` (boolean, default false) to track 2FA status
- The existing `is_creator` field will be set to `true` upon approval

---

### Part 2: Creator Application Dialog (4-Step Wizard)

**Step 1: Personal Info**
- Full Name (required)
- Country (required, dropdown)
- State/Region (required)
- Languages (multi-select, required)
- Social Links (at least 1 required):
  - Instagram, YouTube, Twitter/X, TikTok inputs
  - Validation ensures at least one is filled

**Step 2: Product Types**
- Multi-select question: "What are you here to sell?"
- Options: Digital Products, Tutorials, Courses, Presets, Templates, LUTs, Sound Effects, Music, Other
- User can select multiple options

**Step 3: 2FA Verification**
- Check if user has `mfa_enabled = true`
  - If YES: Show "2FA Active" with green checkmark, allow proceeding
  - If NO: Show "Turn on 2FA" button
    - On click: Send OTP to user's email via `supabase.auth.signInWithOtp`
    - Show 6-digit code input (using existing InputOTP component)
    - On verification success:
      - Update profile `mfa_enabled = true`
      - Allow proceeding to Step 4

**Step 4: Review & Confirm**
- Summary of all entered information
- Terms acknowledgment checkbox
- Submit button

---

### Part 3: Admin Dashboard Updates

**New Tab: "Creator Applications"**
- Added alongside existing "Editor Applications" tab
- Same structure: Pending, Approved, Rejected sub-tabs
- Same 14-day cooldown logic for rejected applications

**Application Table Columns:**
- Applicant (avatar, name, @username)
- Location (country, state)
- Product Types (badges)
- Socials (linked icons)
- Status/Date
- Actions (View, Approve, Reject)

**View Application Dialog:**
- Full details modal similar to editor applications
- Shows all form data
- Approve/Reject buttons

**On Approval:**
- Set `profiles.is_creator = true`
- Set `profiles.verified = true` (optional, per business logic)

---

### Part 4: Access Control for Product Creation

**CreateProduct.tsx Changes:**
- Check if user's `is_creator` is `true`
- If NOT approved creator:
  - Show blocked state with message
  - "Want to sell?" CTA linking to application
  - Or redirect to profile with query param to open application dialog

**Profile Page Changes:**
- Add "Become a Creator" button (only visible on own profile, only if not already a creator)
- Button opens the Creator Application Dialog
- If already a creator, show "Creator" badge instead

---

### Part 5: 2FA Login Flow Enhancement

**Login.tsx Changes:**
- After successful password authentication:
  - Check if user has `mfa_enabled = true` in their profile
  - If YES:
    - Send OTP to email automatically
    - Show OTP verification screen
    - Only complete login after OTP is verified
  - If NO:
    - Normal login flow continues

**Implementation Approach:**
- Use Supabase's email OTP via `supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } })`
- Verify with `supabase.auth.verifyOtp({ email, token, type: 'email' })`
- Store session only after 2FA verification completes

---

### Part 6: New Components to Create

1. **`src/components/creator-application/CreatorApplicationDialog.tsx`**
   - Main dialog wrapper with step management
   - Progress indicator

2. **`src/components/creator-application/Step1PersonalInfo.tsx`**
   - Name, country, state, languages, social links

3. **`src/components/creator-application/Step2ProductTypes.tsx`**
   - Multi-select for product types

4. **`src/components/creator-application/Step3TwoFactor.tsx`**
   - 2FA status check and setup flow
   - OTP input using InputOTP component

5. **`src/components/creator-application/Step4Review.tsx`**
   - Summary and confirmation

6. **`src/components/admin/ViewCreatorApplicationDialog.tsx`**
   - Dialog for viewing full creator application details

---

## Technical Details

### Supabase Email OTP Flow

```typescript
// Send OTP
await supabase.auth.signInWithOtp({
  email: userEmail,
  options: {
    shouldCreateUser: false // Don't create new user, just send OTP
  }
});

// Verify OTP
const { error } = await supabase.auth.verifyOtp({
  email: userEmail,
  token: otpCode,
  type: 'email'
});

if (!error) {
  // Update profile mfa_enabled = true
  await supabase.from('profiles').update({ mfa_enabled: true }).eq('user_id', userId);
}
```

### RLS Policies for creator_applications

```sql
-- Users can read their own applications
CREATE POLICY "Users can view own applications" ON creator_applications
  FOR SELECT USING (user_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

-- Users can insert their own applications
CREATE POLICY "Users can submit applications" ON creator_applications
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

-- Admins can manage all applications
CREATE POLICY "Admins can manage applications" ON creator_applications
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
```

---

## Files to Create/Modify

### New Files
- `src/components/creator-application/CreatorApplicationDialog.tsx`
- `src/components/creator-application/Step1PersonalInfo.tsx`
- `src/components/creator-application/Step2ProductTypes.tsx`
- `src/components/creator-application/Step3TwoFactor.tsx`
- `src/components/creator-application/Step4Review.tsx`
- `src/components/admin/ViewCreatorApplicationDialog.tsx`

### Modified Files
- `src/pages/Profile.tsx` - Add "Become a Creator" button
- `src/pages/CreateProduct.tsx` - Add creator check and blocked state
- `src/pages/Admin.tsx` - Add Creator Applications tab
- `src/pages/Login.tsx` - Add 2FA verification step for mfa_enabled users
- Database migration for `creator_applications` table and `mfa_enabled` column

---

## Estimated Implementation

1. **Database setup** - Create table and column, RLS policies
2. **Creator Application Dialog** - 4-step wizard with all components
3. **Profile integration** - Add button and dialog trigger
4. **CreateProduct access control** - Block non-creators
5. **Admin dashboard tab** - Mirror editor applications pattern
6. **2FA login enhancement** - Add OTP step for enabled users

