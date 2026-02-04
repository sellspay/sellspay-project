
# Hybrid Payments Architecture Implementation Plan

## ✅ Phase 1: COMPLETED - Database Schema & Foundation

### Completed Items:
- [x] Created `country_eligibility` table with 60+ countries seeded
- [x] Added `seller_mode`, `seller_country_code`, `seller_kyc_status`, `seller_status` to profiles
- [x] Added `funds_flow_mode`, `available_on`, `dispute_status` to purchases
- [x] Created `wallet_ledger_entries` table with RLS policies
- [x] Created `payouts` table with RLS policies
- [x] Created `admin_audit_log` table
- [x] Created `get_seller_wallet_balance()` database function
- [x] Created `release_held_funds()` database function for cron jobs
- [x] Created `check-country-eligibility` edge function
- [x] Created `get-wallet-balance` edge function
- [x] Created `CountryEligibilityEditor` admin component
- [x] Created `PayoutQueue` admin component
- [x] Created `WalletCard` dashboard component
- [x] Updated `create-checkout-session` to include `funds_flow_mode`
- [x] Updated `stripe-webhook` to store `funds_flow_mode` and `available_on`
- [x] Added "Countries" and "Payouts" tabs to Admin page

---

## 🔄 Phase 2: IN PROGRESS - Seller Mode & UI Components

### Completed Items:
- [x] Created `CountryEligibilityBadge` component for showing eligibility status
- [x] Created `SellerModeIndicator` component for displaying CONNECT vs MOR mode

### In Progress:
- [ ] Integrate SellerModeIndicator into Settings billing tab
- [ ] Update creator application to set seller_mode based on country
- [ ] Update create-connect-account to check eligibility and set seller_mode

---

## Executive Summary
This plan implements a compliant, scalable hybrid payments system that supports both **Stripe Connect sellers** (eligible countries) and **Platform MoR (Merchant of Record) sellers** (non-eligible countries). The system allows sellers from any country to sell digital products while maintaining proper payment processing compliance.

---

## Current State Analysis

### What Already Exists
1. **Seller Onboarding**: Uses `is_creator`, `is_seller`, `is_editor` flags in `profiles` table
2. **Stripe Connect**: Working integration via `create-connect-account` edge function
3. **Checkout Flow**: Already branches between direct transfer and platform-held funds in `create-checkout-session`
4. **Earnings Tracking**: Uses `purchases.transferred` boolean to track platform-held vs direct-transferred funds
5. **Payout System**: `create-payout` edge function handles transfers and payouts to connected accounts
6. **Private Seller Config**: `private.seller_config` table stores Stripe, PayPal, Payoneer credentials

### What Needs to Be Built
1. **Country Eligibility System**: Admin-managed table of Stripe-supported countries
2. **Seller Mode**: Explicit `CONNECT` vs `MOR` mode per seller
3. **Enhanced Wallet Ledger**: Proper ledger with holds, debits, refunds, disputes
4. **Funds Flow Mode Tagging**: Every order tagged with its payment mode
5. **Admin Payout Queue**: Manual approval workflow for MoR payouts
6. **Dispute/Refund Handling**: Balance locking and reversal logic

---

## Database Schema Changes

### 1. New Table: `country_eligibility`
```sql
CREATE TABLE public.country_eligibility (
  country_code TEXT PRIMARY KEY,         -- ISO 3166-1 alpha-2 (US, GB, etc.)
  country_name TEXT NOT NULL,            -- Display name
  connect_eligible BOOLEAN DEFAULT false,
  notes TEXT,                            -- e.g., "individual only", "business only"
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);
```

### 2. Modify `profiles` Table
Add new columns for seller mode tracking:
```sql
ALTER TABLE public.profiles ADD COLUMN seller_mode TEXT CHECK (seller_mode IN ('CONNECT', 'MOR'));
ALTER TABLE public.profiles ADD COLUMN seller_country_code TEXT;
ALTER TABLE public.profiles ADD COLUMN seller_kyc_status TEXT DEFAULT 'not_started' 
  CHECK (seller_kyc_status IN ('not_started', 'in_review', 'verified', 'rejected'));
ALTER TABLE public.profiles ADD COLUMN seller_status TEXT DEFAULT 'pending'
  CHECK (seller_status IN ('pending', 'active', 'restricted', 'suspended'));
```

### 3. Modify `purchases` Table
Add funds flow mode:
```sql
ALTER TABLE public.purchases ADD COLUMN funds_flow_mode TEXT 
  CHECK (funds_flow_mode IN ('CONNECT', 'MOR'));
ALTER TABLE public.purchases ADD COLUMN available_on TIMESTAMPTZ; -- 7-day hold
ALTER TABLE public.purchases ADD COLUMN dispute_status TEXT;      -- disputed, resolved
```

### 4. New Table: `wallet_ledger_entries`
```sql
CREATE TABLE public.wallet_ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.profiles(id),
  order_id UUID,                          -- Reference to purchase or booking
  order_type TEXT,                        -- 'purchase', 'booking', 'subscription'
  entry_type TEXT NOT NULL CHECK (entry_type IN (
    'credit',           -- Earnings from sale
    'debit',            -- Withdrawal/payout
    'hold_release',     -- 7-day hold cleared
    'refund_debit',     -- Refund reversal
    'chargeback_debit', -- Dispute loss
    'fee_debit',        -- Platform fee
    'payout_debit'      -- Payout executed
  )),
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'locked', 'reversed')),
  available_on TIMESTAMPTZ,               -- When funds become available
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ledger_seller ON wallet_ledger_entries(seller_id);
CREATE INDEX idx_ledger_status ON wallet_ledger_entries(status);
```

### 5. New Table: `payout_profiles`
Extends existing `private.seller_config`:
```sql
ALTER TABLE private.seller_config 
ADD COLUMN preferred_payout_provider TEXT CHECK (
  preferred_payout_provider IN ('STRIPE', 'PAYPAL', 'PAYONEER', 'WISE', 'BANK', 'CRYPTO', 'MANUAL')
);
```

### 6. New Table: `payouts`
```sql
CREATE TABLE public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.profiles(id),
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  provider_type TEXT NOT NULL CHECK (provider_type IN (
    'STRIPE', 'PAYPAL', 'PAYONEER', 'WISE', 'BANK', 'CRYPTO', 'MANUAL'
  )),
  status TEXT DEFAULT 'requested' CHECK (status IN (
    'requested', 'approved', 'processing', 'sent', 'failed', 'cancelled'
  )),
  requested_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  sent_at TIMESTAMPTZ,
  external_reference TEXT,                -- PayPal transaction ID, etc.
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_payouts_seller ON payouts(seller_id);
CREATE INDEX idx_payouts_status ON payouts(status);
```

### 7. New Table: `admin_audit_log`
```sql
CREATE TABLE public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  action_type TEXT NOT NULL,              -- 'payout_approved', 'seller_restricted', etc.
  target_type TEXT,                       -- 'seller', 'payout', 'country'
  target_id UUID,
  old_value JSONB,
  new_value JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Implementation Phases

### Phase 1: Country Eligibility System (Foundation)

**Files to Create/Modify:**

1. **Database Migration**: Create `country_eligibility` table with initial Stripe-supported countries
2. **Edge Function**: `check-country-eligibility` - Returns eligibility for a given country
3. **Admin UI Component**: `src/components/admin/CountryEligibilityEditor.tsx`
4. **Admin Page Tab**: Add "Countries" tab to `/admin`

**Initial Data Seeding:**
Pre-populate with Stripe's current supported countries (US, UK, EU, Australia, etc.) as `connect_eligible = true`

### Phase 2: Seller Mode & Onboarding Branching

**Files to Modify:**

1. **`src/components/creator-application/`**:
   - Add country selection step
   - Show different UI based on eligibility
   - For CONNECT: "Stripe payout supported"
   - For MOR: "Platform payouts (PayPal/Payoneer)"

2. **`supabase/functions/create-connect-account/index.ts`**:
   - Check country eligibility first
   - Refuse Stripe onboarding for MOR-only countries
   - Set `seller_mode = 'CONNECT'` on success

3. **New Edge Function**: `onboard-mor-seller`
   - Collect minimal KYC (name, address, ID)
   - Set `seller_mode = 'MOR'`
   - Require payout profile setup

### Phase 3: Wallet Ledger System

**Files to Create:**

1. **Database Functions**:
   - `get_seller_wallet_balance(seller_id)` - Returns available, pending, locked
   - `create_ledger_entry(...)` - Adds new ledger row
   - `release_held_funds()` - Cron-triggered, moves pending → available

2. **Edge Function**: `get-wallet-balance` - API for dashboard
3. **UI Component**: `src/components/dashboard/WalletCard.tsx` - Enhanced balance display

### Phase 4: Checkout Flow Updates

**Files to Modify:**

1. **`supabase/functions/create-checkout-session/index.ts`**:
   ```
   - Lookup seller's mode
   - Set session metadata: funds_flow_mode = seller.seller_mode
   - CONNECT mode: Use transfer_data (existing)
   - MOR mode: Platform charge only (existing)
   ```

2. **`supabase/functions/stripe-webhook/index.ts`**:
   ```
   - On payment success:
     - Store funds_flow_mode in purchase record
     - Create wallet_ledger_entry with available_on = now + 7 days
     - For MOR: Set status = 'pending'
   ```

### Phase 5: Payout System Overhaul

**Files to Create/Modify:**

1. **New Edge Function**: `request-payout`
   - Check available balance (not pending/locked)
   - Check minimum threshold ($20)
   - Create payout record with status = 'requested'
   - For CONNECT sellers: Auto-approve if balance > min
   - For MOR sellers: Require admin approval

2. **New Edge Function**: `process-payout`
   - Called by admin or auto for CONNECT
   - Routes to appropriate provider (Stripe/PayPal/Payoneer)
   - Creates payout_debit ledger entry

3. **Admin UI**: `src/components/admin/PayoutQueue.tsx`
   - List pending payout requests
   - Approve/deny with notes
   - Export CSV

### Phase 6: Dispute & Refund Handling

**Files to Modify:**

1. **`supabase/functions/stripe-webhook/index.ts`**:
   ```
   - charge.refunded: Create refund_debit ledger entry
   - charge.dispute.created: Lock seller balance, create dispute record
   - charge.dispute.closed: Unlock or debit based on outcome
   ```

2. **Admin UI**: `src/components/admin/DisputesPanel.tsx`
   - View active disputes
   - See affected sellers and locked amounts

### Phase 7: Admin Dashboard Enhancements

**New Admin Tabs:**

1. **Countries**: Edit country eligibility
2. **Payouts**: Approve/manage payout queue
3. **Disputes**: Handle active disputes
4. **Audit Log**: View all admin actions

---

## Security & Compliance

### RLS Policies

```sql
-- wallet_ledger_entries: Sellers see only their own
CREATE POLICY "Sellers view own ledger" ON wallet_ledger_entries
FOR SELECT USING (seller_id IN (
  SELECT id FROM profiles WHERE user_id = auth.uid()
));

-- payouts: Sellers see own, admins see all
CREATE POLICY "Sellers view own payouts" ON payouts
FOR SELECT USING (seller_id IN (
  SELECT id FROM profiles WHERE user_id = auth.uid()
) OR public.has_role(auth.uid(), 'admin'));

-- country_eligibility: Public read, admin write
CREATE POLICY "Anyone can read countries" ON country_eligibility
FOR SELECT USING (true);

CREATE POLICY "Admins can modify countries" ON country_eligibility
FOR ALL USING (public.has_role(auth.uid(), 'admin'));
```

### Payout Controls

- **Minimum threshold**: $20 (configurable)
- **Max daily payout**: $10,000 per seller (configurable)
- **7-day hold** on all earnings before withdrawal
- **Negative balance blocking**: No withdrawals until resolved
- **MoR payouts require admin approval**

---

## Edge Cases Handled

1. **Seller changes country**: Lock account, require admin review, potentially change mode
2. **Partial refunds**: Pro-rate the ledger debit based on refund percentage
3. **Currency handling**: All amounts stored in cents, display conversion in UI
4. **Negative balances**: Block withdrawals, show warning in dashboard
5. **Multiple payout profiles**: Only one active per provider type

---

## File Summary

| Type | Path | Action |
|------|------|--------|
| Migration | `supabase/migrations/xxx_hybrid_payments.sql` | Create tables & columns |
| Edge Fn | `supabase/functions/check-country-eligibility/` | New |
| Edge Fn | `supabase/functions/onboard-mor-seller/` | New |
| Edge Fn | `supabase/functions/get-wallet-balance/` | New |
| Edge Fn | `supabase/functions/request-payout/` | New |
| Edge Fn | `supabase/functions/process-payout/` | New |
| Edge Fn | `supabase/functions/create-checkout-session/` | Modify |
| Edge Fn | `supabase/functions/stripe-webhook/` | Modify |
| Edge Fn | `supabase/functions/create-payout/` | Replace with new system |
| Component | `src/components/admin/CountryEligibilityEditor.tsx` | New |
| Component | `src/components/admin/PayoutQueue.tsx` | New |
| Component | `src/components/admin/DisputesPanel.tsx` | New |
| Component | `src/components/admin/AuditLog.tsx` | New |
| Component | `src/components/dashboard/WalletCard.tsx` | New |
| Page | `src/pages/Admin.tsx` | Add new tabs |
| Page | `src/pages/Dashboard.tsx` | Integrate new wallet UI |

---

## Technical Notes

- **All amounts in cents**: Prevents floating point errors
- **Ledger is append-only**: Never modify entries, only add reversals
- **Webhook idempotency**: Existing `stripe_events` table prevents duplicates
- **Background jobs**: Hold release can use Supabase scheduled functions or external cron
- **No static country lists**: All eligibility data comes from database

