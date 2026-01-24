
# Plan: Add Direct Bank/Debit Account Connection

## Overview

You want users to be able to directly connect their bank accounts or debit cards for withdrawals. Based on my analysis, here's the approach:

## Current Situation

Your platform already uses **Stripe Connect Express** which **already supports** direct bank account connections. When users complete Stripe onboarding, they link their bank account. The issue is:

1. **No explicit UI** explaining that Stripe = Bank Account connection
2. **No way** for users to manage/update their bank account after onboarding
3. **Missing** the Stripe Express Dashboard link where users can update banking info

## Solution Approach

There are **two ways** to handle this with Stripe Connect Express:

### Option A: Stripe Express Dashboard Login Link (Recommended)
Create a "Login Link" that lets users access their Stripe Express Dashboard where they can:
- Update bank account details
- Change payout schedule
- View transaction history
- Manage their account

### Option B: Account Update Link  
Create an "Account Update Link" that takes users through a Stripe-hosted form to update their external bank account.

I recommend **Option A** because it gives users full control over their banking info.

---

## Technical Implementation

### 1. Create New Edge Function: `create-login-link`

This function generates a single-use login link to the Stripe Express Dashboard:

```typescript
// supabase/functions/create-login-link/index.ts
// Uses stripe.accounts.createLoginLink(accountId) 
// Returns URL that opens in new tab
```

### 2. Update PayoutMethodSelector Component

Add a new "Manage Bank Account" section that:
- Shows connected bank info (last 4 digits, bank name)
- Provides "Update Bank Account" button that opens Express Dashboard
- Fetches external account info from Stripe to display current bank

### 3. Create Edge Function: `get-external-accounts`

Fetches the user's linked bank accounts from Stripe to display in the UI:
- Bank name
- Last 4 digits
- Account type (checking/savings)
- Status

### 4. UI Updates

Add a dedicated "Bank Account" card in the Billing tab:
- Shows current linked bank account info
- "Update Bank Account" button → Opens Stripe Express Dashboard
- Clear messaging: "Your bank account is securely managed through Stripe"

---

## Files to Create/Modify

### New Files
- `supabase/functions/create-login-link/index.ts` - Generate Express Dashboard login link
- `supabase/functions/get-external-accounts/index.ts` - Fetch linked bank accounts

### Modified Files
- `src/components/settings/PayoutMethodSelector.tsx` - Add bank account display and management UI

---

## Regulatory & Compliance Notes

This approach is **compliant** because:

1. **Stripe handles KYC/AML** - All bank verification is done by Stripe during onboarding
2. **PCI Compliant** - Bank details are never stored on your servers; Stripe handles everything
3. **Secure** - Login links are single-use and require SMS/email verification
4. **Privacy** - Users control their own banking info through Stripe's secure interface

No additional Terms of Service or Privacy Policy updates are needed since Stripe manages all banking data collection and storage.

---

## Fee Application

The existing fee structure remains unchanged:
- **Stripe Standard Withdrawal**: Free (1-3 business days)
- **Stripe Instant Withdrawal**: 3% fee (immediate)
- **5% Platform Fee**: Applied at transaction time (already implemented)

---

## User Experience Flow

1. **New Seller** → Clicks "Connect Stripe Account" → Completes onboarding (includes bank linking)
2. **Existing Seller** → Sees their bank account info → Clicks "Manage Bank Account" → Opens Stripe Express Dashboard → Updates bank details there
3. **Withdrawal** → User goes to Dashboard → Chooses withdrawal method → Funds sent to linked bank

---

## Implementation Summary

| Task | Complexity | Time |
|------|------------|------|
| Create `create-login-link` function | Low | 15 min |
| Create `get-external-accounts` function | Low | 15 min |
| Update PayoutMethodSelector UI | Medium | 30 min |
| Testing | Low | 15 min |

**Total estimated time: ~1-1.5 hours**
