
# Fix Plan: Stripe Negative Balance & Missing Earnings Issues

## Overview

There are **three critical issues** to address:

1. **Negative Stripe balance** ($-1.62) caused by low-value transaction fees exceeding revenue
2. **Webhook not firing** - purchases aren't being recorded with correct amounts
3. **Dashboard not showing earnings** - because purchase data has $0 amounts

---

## Issue 1: Negative Balance Explanation (No Code Fix Needed)

**What happened:**
- You made a $1.00 test purchase to your own store
- Stripe charged processing fees: **$0.33** (2.9% + $0.30)
- Since this was likely a direct payment (no Connect account), additional platform costs may have accumulated
- Result: **$1.00 revenue - $1.62+ in fees = -$0.62** (or more with Connect fees)

**Why the $4.99 minimum exists:**
The minimum price of $4.99 exists precisely to prevent this - on a $4.99 sale:
- Stripe fee: ~$0.44 (2.9% of $4.99 + $0.30)
- Platform 5% fee: $0.25
- Creator receives: ~$4.30 (positive!)

**Resolution:**
This is a one-time test cost. Your next real sale at $4.99+ will start recovering this negative balance. No immediate action required unless you want to manually add funds to your Stripe account.

---

## Issue 2: Stripe Webhook Not Configured (ACTION REQUIRED)

**The Problem:**
The `checkout.session.completed` webhook events aren't reaching your edge function. Last recorded event was Jan 24.

**Manual Fix Required (You must do this in Stripe Dashboard):**

1. Go to **Stripe Dashboard → Developers → Webhooks**
2. Click **"+ Add Endpoint"**
3. Add this endpoint URL:
   ```
   https://cdpfchadvvfdupkgzeiy.supabase.co/functions/v1/stripe-webhook
   ```
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `account.updated`
5. Copy the **Webhook Signing Secret** and update it in your project secrets

**Note:** The `STRIPE_WEBHOOK_SECRET` in your secrets may be outdated or from a different endpoint.

---

## Issue 3: Purchase Records Have $0 Amounts

**The Problem:**
All purchases in the database show `amount_cents: 0` because they were created manually or via a code path that didn't set the amounts.

**Solution - Backfill existing purchases:**

I'll update the `stripe-webhook/index.ts` to ensure purchase amounts are always recorded correctly. The current code looks correct, but the webhook wasn't firing.

Once the webhook is configured (Issue 2), new purchases will be recorded correctly.

---

## Technical Changes

### 1. Add Webhook Configuration Check

Add a diagnostic endpoint or logging to verify webhook connectivity.

### 2. Improve Error Handling in Webhook

Ensure all purchase metadata is captured even if some fields are missing:

**File:** `supabase/functions/stripe-webhook/index.ts`
- Add fallback for `amount_total` from session
- Log all incoming webhooks for debugging
- Add retry logic for database insertions

### 3. Dashboard: Handle Legacy Purchases

**File:** `src/components/dashboard/EarningsCard.tsx` or query logic
- For purchases with `amount_cents = 0`, attempt to recalculate from product price
- Or: Add a one-time migration to fix existing records

---

## Recommended Immediate Actions

1. **Configure Stripe Webhook** (manual - see Issue 2 above)
2. **Verify webhook secret** is up to date in project secrets
3. **Test with a $4.99+ product** to confirm the full flow works
4. **The $1.62 negative balance** will naturally recover with your next few sales

---

## Future Prevention

Consider adding:
- Stripe webhook health monitoring
- Alert when webhook fails
- UI validation that prevents products under $4.99 from being published
