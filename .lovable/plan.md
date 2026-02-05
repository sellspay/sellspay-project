

# Credit Economy Overhaul: Elite Monetization System

## Overview

This plan completely replaces the current credit economy with a new 3-tier subscription system designed for high-margin monetization. The new system introduces:

- **Browser (Free)**: $0/mo - Browsing only, no AI tools
- **Creator (Pro)**: $69/mo - 2,500 credits + Vibecoder + Image Gen + 5% seller fee
- **Agency (Elite)**: $199/mo - 12,000 credits + Video Gen + 0% seller fee + Gold Badge

---

## Phase 1: Database Cleanup (Delete Current Economy)

### Tables to Drop
| Table | Purpose (Current) |
|-------|-------------------|
| `credit_packages` | Subscription tiers (Starter, Basic, Pro, Power, Enterprise) |
| `credit_transactions` | Usage and purchase audit log |
| `credit_topups` | One-time credit top-up products |
| `wallet_ledger_entries` | Credit wallet transaction log |

### Columns to Remove from `profiles`
- `credit_balance` (integer, default 3)

### Edge Functions to Delete
| Function | Purpose |
|----------|---------|
| `check-credits` | Returns user's credit balance |
| `deduct-credit` | Subtracts 1 credit per tool use |
| `add-credits` | Adds credits after Stripe session verification |
| `create-credit-checkout` | Creates Stripe subscription checkout |
| `create-topup-checkout` | Creates one-time top-up checkout |
| `manage-credit-subscription` | Checks/manages subscription status via Stripe |

---

## Phase 2: New Database Schema

### New Table: `user_wallets`
Replaces the `credit_balance` column with a dedicated wallet system for atomic operations.

```sql
CREATE TABLE user_wallets (
  user_id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  balance int DEFAULT 0 NOT NULL,
  last_refill_at timestamptz DEFAULT now()
);
```

### New Table: `wallet_transactions`
Clean audit trail for all credit movements.

```sql
CREATE TABLE wallet_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  amount int NOT NULL,  -- Negative for usage, positive for refills
  action text NOT NULL, -- 'vibecoder_gen', 'image_gen', 'video_gen', 'monthly_refill', 'topup'
  description text,
  created_at timestamptz DEFAULT now()
);
```

### New Table: `subscription_plans`
Defines the 3 tiers and their capabilities.

```sql
CREATE TABLE subscription_plans (
  id text PRIMARY KEY,  -- 'browser', 'creator', 'agency'
  name text NOT NULL,
  price_cents int NOT NULL,
  yearly_price_cents int,
  monthly_credits int NOT NULL,
  vibecoder_access boolean DEFAULT false,
  image_gen_access boolean DEFAULT false,
  video_gen_access boolean DEFAULT false,
  seller_fee_percent numeric(4,2) DEFAULT 10,
  badge_type text DEFAULT 'none',  -- 'none', 'grey', 'gold'
  stripe_price_id text,
  stripe_yearly_price_id text,
  created_at timestamptz DEFAULT now()
);
```

### Updated `profiles` Table
Add subscription tracking columns.

```sql
ALTER TABLE profiles
ADD COLUMN subscription_plan text DEFAULT 'browser' REFERENCES subscription_plans(id),
ADD COLUMN subscription_status text DEFAULT 'active',
ADD COLUMN subscription_expires_at timestamptz,
ADD COLUMN stripe_customer_id text,
ADD COLUMN stripe_subscription_id text;
```

### Database Function: `deduct_credits`
Atomic credit deduction with race-condition protection.

```sql
CREATE OR REPLACE FUNCTION deduct_credits(p_user_id uuid, p_amount int, p_action text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_bal int;
BEGIN
  SELECT balance INTO current_bal FROM user_wallets WHERE user_id = p_user_id FOR UPDATE;
  
  IF current_bal IS NULL OR current_bal < p_amount THEN
    RETURN false;
  END IF;

  UPDATE user_wallets SET balance = balance - p_amount WHERE user_id = p_user_id;
  
  INSERT INTO wallet_transactions (user_id, amount, action, description)
  VALUES (p_user_id, -p_amount, p_action, 'AI generation');

  RETURN true;
END;
$$;
```

---

## Phase 3: Credit Cost Structure

| Action | Credit Cost | Tier Required |
|--------|-------------|---------------|
| Vibecoder (Code Generation) | 25 | Creator+ |
| Image Generation (Flux) | 100 | Creator+ |
| Video Generation (Luma) | 500 | Agency only |
| SFX Generator | 25 | Creator+ |
| Voice Isolator | 25 | Creator+ |

### Monthly Allocations
- **Creator ($69)**: 2,500 credits = ~100 code gens OR ~25 images
- **Agency ($199)**: 12,000 credits = ~24 videos OR ~480 code gens

---

## Phase 4: New Edge Functions

### `check-subscription` (Replaces `check-credits`)
Returns user's plan tier, credit balance, and capabilities.

```typescript
// Response shape
{
  plan: 'browser' | 'creator' | 'agency',
  credits: number,
  capabilities: {
    vibecoder: boolean,
    imageGen: boolean,
    videoGen: boolean,
  },
  sellerFee: number,
  badge: 'none' | 'grey' | 'gold',
  expiresAt: string | null,
}
```

### `deduct-ai-credits`
Deducts credits based on action type, enforces tier gating.

### `create-plan-checkout`
Creates Stripe checkout for Creator/Agency subscriptions.

### `stripe-subscription-webhook`
Handles subscription lifecycle: created, renewed, cancelled.

---

## Phase 5: Frontend Hook Replacement

### Delete
- `src/hooks/useCredits.ts`
- `src/components/credits/CreditWallet.tsx`
- `src/components/credits/TopUpDialog.tsx`

### New: `src/hooks/useSubscription.ts`

```typescript
interface UseSubscriptionReturn {
  plan: 'browser' | 'creator' | 'agency';
  credits: number;
  loading: boolean;
  capabilities: {
    vibecoder: boolean;
    imageGen: boolean;
    videoGen: boolean;
  };
  sellerFee: number;
  badge: 'none' | 'grey' | 'gold';
  
  // Actions
  canUseFeature: (feature: 'vibecoder' | 'image' | 'video') => boolean;
  deductCredits: (action: string, amount: number) => Promise<boolean>;
  refreshSubscription: () => Promise<void>;
}
```

---

## Phase 6: UI Components

### New: Premium Lock Overlay
Shown over tools when user lacks the required tier.

```
+----------------------------------+
|         🔒 Unlock Vibecoder      |
|                                  |
|   Build unlimited storefronts   |
|   with our Premium AI architect. |
|                                  |
|   [Upgrade to Creator - $69/mo] |
+----------------------------------+
```

### New: Credit Fuel Gauge (Header)
Replaces the current credit badge.

```
┌────────────────────────┐
│  ⚡ 2,340 Credits      │
│  ━━━━━━━━━━━░░░ 94%   │
│  [+] Top Up            │
└────────────────────────┘
```

### New: Locked Tool Button (Visible but Locked)
Tools show with a lock icon for lower tiers.

```typescript
<ToolButton 
  icon={<Video />}
  label="Video Gen"
  locked={!capabilities.videoGen}
  lockBadge="AGENCY"
  onClick={handleVideoGen}
/>
```

---

## Phase 7: Vibecoder Gating

### Before First Prompt
- Check user's plan via `useSubscription`
- If `plan === 'browser'`: Show `PremiumGate` overlay
- If `plan !== 'browser'` but `credits < 25`: Show "Out of Fuel" overlay

### On Generate
1. Frontend checks `credits >= 25`
2. Call `deduct-ai-credits` with `action: 'vibecoder_gen'`
3. If success: Proceed with generation
4. If fail (402): Show "Out of Fuel" modal

### Backend Enforcement
The `vibecoder-v2` edge function will:
1. Verify user's plan tier
2. Attempt credit deduction via RPC
3. Only call Gemini if both pass

---

## Phase 8: Pricing Page Redesign

Replace the current 5-tier card layout with a 3-tier premium design.

### Structure
```
Browser (Free)    Creator ($69)    Agency ($199)
────────────────────────────────────────────────
0 credits         2,500/mo         12,000/mo
10% seller fee    5% seller fee    0% seller fee
No AI tools       Code + Image     Code + Image + Video
No badge          Grey badge       Gold badge
```

### Seller Fee Value Prop
Highlight the savings prominently:
- "Sell $1,000/mo? Save $50 with Creator."
- "Sell $5,000/mo? Save $500 with Agency."

---

## Phase 9: Stripe Product Setup

### Products to Create in Stripe
| Product | Monthly Price | Yearly Price |
|---------|---------------|--------------|
| Creator | $69 | $690 (save ~15%) |
| Agency | $199 | $1,990 (save ~15%) |

### Top-Up Packs (One-Time)
| Pack | Credits | Price |
|------|---------|-------|
| Starter | 500 | $9 |
| Pro | 2,500 | $39 |
| Power | 6,000 | $79 |

---

## Files to Modify

### Delete
| File | Reason |
|------|--------|
| `src/hooks/useCredits.ts` | Replaced by `useSubscription` |
| `src/components/credits/CreditWallet.tsx` | Replaced by new Credit Fuel Gauge |
| `src/components/credits/TopUpDialog.tsx` | Replaced by new Top-Up modal |
| `supabase/functions/check-credits/` | Replaced by `check-subscription` |
| `supabase/functions/deduct-credit/` | Replaced by `deduct-ai-credits` |
| `supabase/functions/add-credits/` | No longer needed |
| `supabase/functions/create-credit-checkout/` | Replaced by `create-plan-checkout` |
| `supabase/functions/create-topup-checkout/` | Will be rebuilt for new packs |
| `supabase/functions/manage-credit-subscription/` | Merged into `check-subscription` |

### Create
| File | Purpose |
|------|---------|
| `src/hooks/useSubscription.ts` | New subscription + credits hook |
| `src/components/subscription/CreditFuelGauge.tsx` | Header credit indicator |
| `src/components/subscription/PlanLockOverlay.tsx` | Premium gate for tools |
| `src/components/subscription/UpgradeModal.tsx` | Tier upgrade CTA modal |
| `supabase/functions/check-subscription/` | Unified plan + credits check |
| `supabase/functions/deduct-ai-credits/` | Deduct with action type |
| `supabase/functions/create-plan-checkout/` | Stripe subscription checkout |
| `supabase/functions/subscription-webhook/` | Handle Stripe events |

### Update
| File | Changes |
|------|---------|
| `src/pages/Pricing.tsx` | Complete redesign for 3-tier system |
| `src/components/ai-builder/AIBuilderCanvas.tsx` | Use `useSubscription`, add gates |
| `src/components/ai-builder/VibecoderChat.tsx` | Credit check before generation |
| `src/components/tools/ToolContent.tsx` | Replace `useCredits` with `useSubscription` |
| `src/components/tools/ProToolsGate.tsx` | Update for tier-based gating |
| `supabase/functions/vibecoder-v2/index.ts` | Add plan + credit enforcement |
| `src/pages/AIBuilder.tsx` | Add subscription check |

---

## Migration Strategy

1. **Database First**: Run cleanup migration to drop old tables, then create new schema
2. **Edge Functions**: Deploy new functions alongside old ones, switch references
3. **Frontend**: Update hooks and components, test thoroughly
4. **Stripe**: Create new products/prices, update webhook handlers
5. **Launch**: Flip the switch, monitor for issues

### Data Migration
- Users with existing subscriptions: Map to closest new tier
- Users with credit balances: Convert at 1:1 ratio to new wallet
- Log all migrations for audit

---

## Technical Notes

### RLS Policies
All new tables will have RLS enabled:
- `user_wallets`: Users can only read/update their own row
- `wallet_transactions`: Users can only read their own transactions
- `subscription_plans`: Public read access

### Webhook Security
The Stripe webhook endpoint will verify signatures using `stripe.webhooks.constructEvent()` to prevent spoofing.

### Rate Limiting
Consider adding rate limits to the `deduct-ai-credits` function to prevent abuse.

