

# Platform Subscription Redesign: Tiered Plans + Fee Reduction System

## Overview

This is a strategic redesign of the pricing/subscription system to create a compelling value proposition for sellers/creators. The new system introduces three subscription tiers (Starter, Pro, Enterprise) with monthly base prices, credits included, a separate top-up system, and critically - **reduced seller fees** as a key tier benefit.

---

## Current State Analysis

### Existing Credit Packages (Database)
| Name | Credits | Price | 
|------|---------|-------|
| Starter | 15 | $4.99 |
| Basic | 50 | $9.99 |
| Pro | 150 | $24.99 |
| Power | 350 | $49.99 |
| Enterprise | 800 | $99.99 |

### Current Issues
- No subscription tier tracking in profiles
- All sellers pay 5% platform fee regardless
- No top-up system (only subscription upgrades)
- Credits only used for tools, no seller benefits

---

## New System Architecture

### Subscription Tiers

| Tier | Monthly Price | Credits Included | Seller Fee | Credit Value |
|------|---------------|------------------|------------|--------------|
| **Starter** | $19.99 | ~60 credits | 5% (no reduction) | ~$0.33/credit |
| **Pro** | $49.99 | ~150 credits | **3%** (2% savings) | ~$0.33/credit |
| **Enterprise** | $99.99 | ~300 credits | **0%** (5% savings) | ~$0.33/credit |

*Credit amounts calculated at approximately $0.33/credit for subscription value*

### Top-Up Pricing (Premium rates - incentivizes subscription)
| Top-Up | Price | Credit Value |
|--------|-------|--------------|
| 15 credits | $7.99 | ~$0.53/credit (60% premium) |
| 50 credits | $24.99 | ~$0.50/credit (50% premium) |
| 100 credits | $44.99 | ~$0.45/credit (35% premium) |
| 250 credits | $99.99 | ~$0.40/credit (20% premium) |

---

## Implementation Plan

### Phase 1: Database Schema Updates

**New columns for `profiles` table:**
```text
subscription_tier: TEXT (null, 'starter', 'pro', 'enterprise')
subscription_stripe_id: TEXT (Stripe subscription ID for tracking)
```

**New table: `credit_topups`**
```text
id: UUID (primary key)
name: TEXT ('Small', 'Medium', 'Large', 'Mega')
credits: INTEGER
price_cents: INTEGER
stripe_price_id: TEXT
is_active: BOOLEAN
display_order: INTEGER
```

**Update `credit_packages` table:**
- Convert existing packages to represent subscription tiers
- Update credit amounts and prices for new structure:
  - Starter: 60 credits, $19.99
  - Pro: 150 credits, $49.99
  - Enterprise: 300 credits, $99.99

### Phase 2: Edge Function Updates

#### 2.1 Update `manage-credit-subscription`
- Add subscription tier detection and return in response
- Map product IDs to tier names ('starter', 'pro', 'enterprise')
- Include tier in subscription response object

#### 2.2 Update `create-credit-checkout`
- Handle both subscription and top-up purchases
- Accept `type: 'subscription' | 'topup'` parameter
- Route to appropriate Stripe price IDs
- Update profile's `subscription_tier` on successful subscription

#### 2.3 Create `create-topup-checkout` (new function)
- Handle one-time credit purchases (not subscriptions)
- Use Stripe `mode: 'payment'` instead of `mode: 'subscription'`
- Add credits to balance on completion

#### 2.4 Update `create-checkout-session` (product purchases)
- Fetch buyer's subscription tier from profile
- Apply dynamic platform fee based on tier:
  - No tier or Starter: 5%
  - Pro: 3%
  - Enterprise: 0%
- Log fee reduction in metadata

#### 2.5 Update `create-editor-booking`
- Same tier-based fee reduction logic as product purchases

#### 2.6 Update `stripe-webhook`
- Handle subscription creation/updates
- Update `profiles.subscription_tier` when subscription changes
- Handle top-up purchase completions

### Phase 3: Frontend Updates

#### 3.1 Redesign Pricing Page (`src/pages/Pricing.tsx`)

**New Layout Structure:**
1. **Hero Section**: "Choose Your Plan"
2. **Three Tier Cards** (horizontal on desktop):
   - Starter ($19.99/mo) - "Perfect for casual creators"
   - Pro ($49.99/mo) - "MOST POPULAR" badge, "For serious sellers"
   - Enterprise ($99.99/mo) - "For power users and teams"
3. **Features per tier** highlighting:
   - Credits included
   - **Seller fee reduction** (prominent display)
   - AI tool access
   - Future benefits placeholders
4. **FAQ Section** updated

**Tier Card Content:**
```text
STARTER - $19.99/month
- 60 credits/month
- All Pro AI tools
- 5% seller fee (standard)
[Subscribe]

PRO - $49.99/month (MOST POPULAR)
- 150 credits/month  
- All Pro AI tools
- 3% seller fee (Save 2%)
- Priority support
- Early access to new tools
[Subscribe]

ENTERPRISE - $99.99/month
- 300 credits/month
- All Pro AI tools
- 0% seller fee (Save 5%)
- Dedicated support
- Custom integrations
- Team features (coming soon)
[Subscribe]
```

#### 3.2 Create Credit Top-Up Dialog Component

**New component: `src/components/credits/TopUpDialog.tsx`**
- Modal dialog triggered from wallet click
- Shows current credit balance
- Displays top-up packages with prices
- "More expensive than subscription" visual indicator
- Links to upgrade subscription as alternative

**Top-Up Options Display:**
```text
Your Credits: 45

Need more credits?

[15 credits - $7.99] [50 credits - $24.99]
[100 credits - $44.99] [250 credits - $99.99]

💡 Tip: Upgrade your plan for better value!
[View Plans]
```

#### 3.3 Update Credit Wallet Component

**Changes to `src/components/credits/CreditWallet.tsx`:**
- Click opens TopUpDialog instead of navigating to /pricing
- Show subscription tier badge (if subscribed)
- Display "Top Up" button that opens dialog

#### 3.4 Update Header Wallet Display

**Changes to `src/components/layout/Header.tsx`:**
- Wallet click opens TopUpDialog
- Show tier indicator next to balance (e.g., "45 ⭐ Pro")

#### 3.5 Update useCredits Hook

**Add to `src/hooks/useCredits.ts`:**
- `subscriptionTier: string | null` state
- `purchaseTopUp(packageId: string)` function
- Update cache to include tier information

#### 3.6 Update Dashboard Fee Display

**Changes to `src/pages/Dashboard.tsx`:**
- Show current seller fee rate based on tier
- Display "Save X% with Pro/Enterprise" for lower tiers
- Fee breakdown in earnings card

---

## Stripe Product Setup Required

### New Stripe Products Needed:

**Subscription Products:**
1. Platform Starter - $19.99/month recurring
2. Platform Pro - $49.99/month recurring  
3. Platform Enterprise - $99.99/month recurring

**Top-Up Products:**
1. Credit Top-Up 15 - $7.99 one-time
2. Credit Top-Up 50 - $24.99 one-time
3. Credit Top-Up 100 - $44.99 one-time
4. Credit Top-Up 250 - $99.99 one-time

---

## Fee Calculation Logic

### Product/Booking Checkout Fee Calculation:
```text
// Pseudocode for create-checkout-session
const TIER_FEE_RATES = {
  null: 0.05,      // No subscription: 5%
  'starter': 0.05, // Starter: 5%
  'pro': 0.03,     // Pro: 3%
  'enterprise': 0  // Enterprise: 0%
};

// Get seller's subscription tier
const sellerTier = creatorProfile.subscription_tier;
const platformFeeRate = TIER_FEE_RATES[sellerTier] ?? 0.05;

// Calculate fees
const platformFee = Math.round(grossAmount * platformFeeRate);
const stripeProcessingFee = Math.round(grossAmount * 0.029) + 30;
const totalApplicationFee = stripeProcessingFee + platformFee;
const creatorPayout = grossAmount - totalApplicationFee;
```

---

## Technical Details

### Files to Create:
1. `src/components/credits/TopUpDialog.tsx` - Modal for purchasing top-up credits
2. `supabase/functions/create-topup-checkout/index.ts` - One-time credit purchase

### Files to Modify:
1. `src/pages/Pricing.tsx` - Complete redesign for tier-based plans
2. `src/components/credits/CreditWallet.tsx` - Open dialog instead of navigate
3. `src/components/layout/Header.tsx` - Wallet click behavior
4. `src/hooks/useCredits.ts` - Add tier tracking and top-up function
5. `supabase/functions/create-checkout-session/index.ts` - Dynamic fee based on tier
6. `supabase/functions/create-editor-booking/index.ts` - Dynamic fee based on tier
7. `supabase/functions/manage-credit-subscription/index.ts` - Return tier info
8. `supabase/functions/create-credit-checkout/index.ts` - Handle new tier subscriptions
9. `supabase/functions/stripe-webhook/index.ts` - Update profile tier on subscription events
10. `src/pages/Dashboard.tsx` - Show fee rate and upgrade prompts

### Database Changes:
1. Add `subscription_tier` column to `profiles`
2. Add `subscription_stripe_id` column to `profiles`
3. Create `credit_topups` table
4. Update `credit_packages` table data

---

## User Experience Flow

### New User Flow:
1. Signs up → Gets 3 free credits
2. Uses AI tools → Credits deplete
3. Clicks wallet → Sees TopUpDialog
4. Either tops up (expensive) or subscribes (better value)
5. If seller → Sees fee reduction benefit on pricing page

### Seller Conversion Flow:
1. Seller sees 5% fee on earnings
2. Notices "Save 2% with Pro" prompt
3. Views pricing page → Sees comprehensive benefits
4. Subscribes to Pro → Fee drops to 3%
5. Dashboard reflects new fee rate

### Top-Up vs Subscribe Decision:
```text
User needs 50 credits:
- Top-up: $24.99 one-time
- Pro subscription: $49.99/month for 150 credits + 3% fee reduction

The subscription offers better value if:
- They need credits regularly
- They're also a seller (fee savings)
```

---

## Future Extensibility

This architecture supports future additions:
- Manga generator (Pro+ only)
- Video generators (Enterprise only)
- Team accounts (Enterprise)
- Higher quality exports
- API access
- Custom branding options

