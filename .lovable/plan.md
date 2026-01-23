
# Implementation Plan: Credit Subscription System, Product-Subscription Integration, and UI Improvements

## Overview
This plan addresses four key areas of improvement:
1. **Create Product Flow** - Show existing subscription plans when selecting "Subscription Only" or "Both" pricing types
2. **Pricing Page Redesign** - Replace 5-card layout with a single card featuring dropdown credit selection
3. **Navbar Wallet Counter** - Add credit balance indicator next to profile avatar
4. **Monthly Credit Subscriptions** - Convert one-time purchases to recurring subscriptions with cancellation in Settings

---

## 1. Create Product Subscription Selection Flow

### Current Behavior
When a creator selects "Subscription Only" or "Both" in the pricing section, there's just a text hint but no way to select which subscription plan the product belongs to.

### New Behavior
- When "Subscription Only" or "Both" is clicked, display a section showing the creator's existing subscription plans
- Each plan shows name, price, and number of products already assigned
- Creator can select which plan(s) to attach the product to
- If no plans exist, show a "Create Subscription Plan" button that opens the same 3-step wizard used in `/subscription-plans`

### Technical Changes

**File: `src/pages/CreateProduct.tsx`**
- Add state for fetching creator's subscription plans
- Add state for selected plan(s)
- Import and use `CreatePlanWizard` component for inline plan creation
- Add UI section under pricing type buttons that appears when `pricingType === "subscription"` or `pricingType === "both"`
- When saving product, also insert into `subscription_plan_products` table

```text
New State Variables:
- subscriptionPlans: SubscriptionPlan[]
- selectedPlanIds: string[]
- showCreatePlanWizard: boolean
- loadingPlans: boolean
```

**New UI Section (under pricing type):**
```text
+------------------------------------------+
| Select Subscription Plan(s)              |
+------------------------------------------+
| [x] Premium Access - $19.99/mo (5 items) |
| [ ] Basic Tier - $9.99/mo (3 items)      |
+------------------------------------------+
| + Create New Plan (opens wizard popup)   |
+------------------------------------------+
```

---

## 2. Pricing Page Redesign

### Current Layout
5 separate cards showing each credit package (Starter, Basic, Pro, Power, Enterprise) with individual pricing.

### New Layout
Single prominent card with:
- Dropdown selector for credit amount
- Dynamic price display based on selection
- Comprehensive description of what credits unlock
- List of Pro tools available
- Visual indicator for savings percentage
- FAQ section remains below

### Technical Changes

**File: `src/pages/Pricing.tsx`**
- Replace grid of cards with single centered card component
- Add `Select` dropdown for package selection
- Show selected package details dynamically
- Keep existing FAQ section

**New UI Structure:**
```text
+--------------------------------------------------+
|  [Icon] Credit Wallet                            |
|                                                  |
|  Select Your Package:                            |
|  [Dropdown: Pro Credits - 150 for $24.99 ▼]      |
|                                                  |
|  $24.99         Save 50%!                        |
|  150 Credits    ($0.17 per credit)               |
|                                                  |
|  ────────────────────────────────────────────    |
|  WHAT YOU UNLOCK:                                |
|  ✓ SFX Generator - Create sound effects from AI |
|  ✓ Voice Isolator - Remove vocals or background |
|  ✓ SFX Isolator - Isolate sound effects         |
|  ✓ Music Splitter - Split stems                 |
|                                                  |
|  ────────────────────────────────────────────    |
|  BENEFITS:                                       |
|  • Credits renew monthly (subscription)         |
|  • Cancel anytime from Settings                 |
|  • Unused credits roll over*                    |
|  • Priority processing                          |
|                                                  |
|        [Subscribe Now - $24.99/month]           |
+--------------------------------------------------+
```

---

## 3. Navbar Wallet Counter

### Current State
Credit wallet only visible in Tools sidebar. No navbar indicator.

### New Feature
Small wallet icon with credit counter badge next to profile avatar in header.

### Technical Changes

**File: `src/components/layout/Header.tsx`**
- Import `useCredits` hook
- Import `CreditWallet` component with "compact" variant
- Add wallet display between nav items and profile dropdown
- Show only when user is logged in

**UI Placement:**
```text
[Logo] | Store | Creators | Tools | Pricing | [Hire Editors] | [🪙 150] [Avatar ▼]
                                                               ^^^^^^^^
                                                              New wallet
```

---

## 4. Monthly Credit Subscriptions

### Current Flow
Credits are one-time purchases (`mode: "payment"`).

### New Flow
- Credits become monthly subscriptions (`mode: "subscription"`)
- Credits renew each month automatically
- Users can cancel from Settings page
- Both buyers and creators can manage subscriptions

### Technical Changes

**A. Edge Function: `supabase/functions/create-credit-checkout/index.ts`**
- Change `mode: "payment"` to `mode: "subscription"`
- Add `recurring_interval: "month"` to price configuration (or use existing recurring prices)

**B. Edge Function: Create `supabase/functions/manage-credit-subscription/index.ts`**
- Handle subscription status checking
- Handle subscription cancellation via Stripe Customer Portal

**C. Edge Function: Update `supabase/functions/add-credits/index.ts`**
- Modify to work with subscription renewal webhooks
- Add credits on each successful subscription payment

**D. Frontend: `src/pages/Settings.tsx`**
- Add "Credit Subscriptions" section in Billing tab
- Show active credit subscription details (plan name, renewal date)
- Add "Cancel Subscription" button that opens Stripe portal

**E. Database Update**
- Add column to track credit subscription status in profiles or new table
- Alternative: Query Stripe directly for subscription status (simpler approach)

### New Settings UI (Billing Tab):
```text
+--------------------------------------------------+
| Credit Subscription                              |
+--------------------------------------------------+
| Plan: Pro Credits (150 credits/month)            |
| Status: Active                                   |
| Next Renewal: Feb 23, 2026                       |
| Amount: $24.99/month                             |
|                                                  |
| [Manage Subscription]  [Cancel Subscription]     |
+--------------------------------------------------+
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/manage-credit-subscription/index.ts` | Check subscription status and create portal sessions |
| `src/components/product/SubscriptionPlanSelector.tsx` | Reusable component for selecting plans in product creation |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/CreateProduct.tsx` | Add subscription plan selector when pricing is subscription/both |
| `src/pages/Pricing.tsx` | Redesign to single card with dropdown |
| `src/components/layout/Header.tsx` | Add wallet counter next to profile |
| `src/pages/Settings.tsx` | Add credit subscription management section |
| `src/hooks/useCredits.ts` | Add subscription status checking |
| `supabase/functions/create-credit-checkout/index.ts` | Change to subscription mode |
| `supabase/config.toml` | Register new edge function |

---

## Implementation Sequence

1. **Phase 1: Navbar Wallet** (quick win)
   - Add compact wallet to Header

2. **Phase 2: Pricing Page Redesign**
   - Create single-card layout with dropdown
   - Update edge function to subscription mode

3. **Phase 3: Subscription Management**
   - Create portal edge function
   - Add cancellation UI to Settings

4. **Phase 4: Product Subscription Integration**
   - Create plan selector component
   - Integrate into CreateProduct page
   - Add inline CreatePlanWizard popup

---

## Notes

- The credit packages already exist in Stripe with price IDs - these need to be recreated as recurring prices OR we create new recurring prices alongside existing ones
- Stripe Customer Portal must be configured by the user to allow subscription management
- The existing `CreatePlanWizard` component can be reused directly in the product creation flow
