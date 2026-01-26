
# Universal Payout Provider Selection

## Problem Identified

Currently, the payout architecture has a critical flaw:

1. **All buyer payments go through Stripe** (the platform's default payment processor)
2. **When sellers withdraw**, the `create-payout` function **requires Stripe Connect** because it uses `stripe.transfers.create()` and `stripe.payouts.create()` to move funds
3. **The PayPal payout function** only searches for purchases with `paypal_%` payment IDs (purchases made via PayPal checkout) - but since buyers primarily pay with Stripe, this captures almost nothing
4. **Result**: Sellers can ONLY withdraw via Stripe Connect, regardless of their preferred payout method

## Solution: Unified Payout Architecture

The key insight: **Funds collected in Stripe can be sent out via ANY provider** - the platform just needs to initiate payouts from its own account rather than requiring sellers to have their own Stripe accounts.

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    CURRENT FLOW (Broken)                            │
├─────────────────────────────────────────────────────────────────────┤
│  Buyer Pays → Stripe (Platform Account) → transferred: false        │
│                                                                      │
│  Seller Withdraws → Requires Stripe Connect → stripe.transfers()    │
│                     PayPal option only sees "paypal_%" purchases    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    NEW FLOW (Fixed)                                 │
├─────────────────────────────────────────────────────────────────────┤
│  Buyer Pays → Stripe (Platform Account) → transferred: false        │
│                                                                      │
│  Seller Withdraws → Choose Provider:                                 │
│    • Stripe Connect → Use stripe.transfers() (existing)            │
│    • PayPal → Platform sends PayPal payout from ALL pending funds  │
│    • Payoneer → Platform sends Payoneer payout from ALL funds      │
└─────────────────────────────────────────────────────────────────────┘
```

## Implementation Plan

### 1. Create New Unified Withdrawal Edge Function

**File**: `supabase/functions/create-unified-payout/index.ts`

This new function will:
- Accept a `provider` parameter: `stripe`, `paypal`, or `payoneer`
- Fetch ALL pending earnings (`transferred: false`) regardless of how buyer paid
- Route payout through the selected provider:
  - **Stripe**: Transfer to seller's Stripe Connect account, then payout to their bank
  - **PayPal**: Platform sends PayPal Payouts API mass payment to seller's PayPal email
  - **Payoneer**: Platform sends Payoneer payout to seller's Payoneer payee ID

### 2. Update `get-stripe-balance` to Return Provider-Agnostic Data

The balance function should:
- Continue calculating total pending earnings from ALL purchases (already does this)
- Return clear data on what's available for withdrawal via ANY provider
- Show breakdown by payment source for transparency (optional)

### 3. Fix `create-paypal-payout` Function

Remove the filter `.like("stripe_payment_intent_id", "paypal_%")` so it can pay out ALL pending earnings, not just PayPal-originated purchases.

Key change at line 131-137:
```typescript
// BEFORE (broken - only PayPal payments)
const { data: pendingPurchases } = await supabaseAdmin
  .from("purchases")
  .eq("transferred", false)
  .like("stripe_payment_intent_id", "paypal_%")  // ← REMOVE THIS

// AFTER (correct - all platform-held funds)
const { data: pendingPurchases } = await supabaseAdmin
  .from("purchases")
  .eq("transferred", false)
  // No payment method filter - seller can choose any payout provider
```

### 4. Update Stripe Payout Flow

Modify `create-payout` to handle cases where seller wants Stripe but doesn't have Stripe Connect:
- Use **Stripe Payouts API** to send funds directly to bank details stored in the platform (alternative flow)
- OR clearly message that Stripe Connect is required for Stripe withdrawals

### 5. Update EarningsCard UI Component

**File**: `src/components/dashboard/EarningsCard.tsx`

Updates:
- Remove hard-coded provider restrictions in the withdraw dialog
- Enable ALL connected providers for withdrawal regardless of payment source
- Update messaging to clarify sellers can use any connected provider

### 6. Update PayoutMethodSelector to Clarify the Model

Add helper text explaining:
> "Connect your preferred payout method. All earnings from product sales and editor bookings can be withdrawn to any connected provider."

## Technical Details

### Edge Function Changes

| Function | Change |
|----------|--------|
| `create-paypal-payout` | Remove `paypal_%` filter, query ALL `transferred: false` purchases |
| `create-payoneer-payout` | Add real pending earnings calculation (currently hardcoded/placeholder) |
| `create-payout` (Stripe) | Keep as-is for Stripe Connect users, add error messaging for non-Connect users |

### Database Tracking

When marking purchases as transferred, include which provider was used:
```sql
UPDATE purchases SET 
  transferred = true,
  transferred_at = NOW(),
  stripe_transfer_id = 'paypal_payout_BATCH_ID' -- or 'payoneer_PO_123'
WHERE id IN (...);
```

### Fee Structure (No Changes)

- Stripe Standard: Free (1-3 days)
- Stripe Instant: 3% fee
- PayPal: Free from platform (PayPal may charge withdrawal fees)
- Payoneer: Free from platform (Payoneer may charge fees)

## Files to Modify

1. **`supabase/functions/create-paypal-payout/index.ts`** - Remove payment method filter
2. **`supabase/functions/create-payoneer-payout/index.ts`** - Add real earnings calculation
3. **`src/components/dashboard/EarningsCard.tsx`** - Update UI provider selection logic
4. **`supabase/functions/get-stripe-balance/index.ts`** - Minor updates for clarity

## Outcome

After implementation:
- Seller sells product → Buyer pays via Stripe → Funds tracked as pending
- Seller goes to Dashboard → Sees available balance
- Seller clicks "Withdraw" → Chooses between Stripe, PayPal, or Payoneer
- Platform sends payout via chosen provider → Marks purchases as transferred
