

# Direct Bank Account Payouts for Sellers via Payoneer

## Current Status

Payoneer integration is **partially implemented**:

### ✅ Already Built
- `supabase/functions/register-payoneer-payee/index.ts` - Registers seller with Payoneer
- `supabase/functions/create-payoneer-payout/index.ts` - Creates payout to seller's Payoneer
- `supabase/functions/disconnect-payoneer/index.ts` - Disconnects Payoneer account
- `supabase/functions/check-payoneer-status/index.ts` - Checks Payoneer connection status
- UI in `PayoutMethodSelector.tsx` - Email input, connect/disconnect buttons

### ⏳ Pending
- **Payoneer API credentials** - Need `PAYONEER_PARTNER_ID`, `PAYONEER_API_USERNAME`, `PAYONEER_API_PASSWORD`, `PAYONEER_PROGRAM_ID`
- The edge functions currently return `notConfigured: true` when secrets are missing

## How Payoneer Works

```text
┌─────────────────────────────────────────────────────────────────┐
│                    PAYONEER PAYOUT FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. SELLER CONNECTS                                             │
│     • Enters Payoneer email in settings                         │
│     • Platform registers them as a payee via Payoneer API       │
│     • Payoneer verifies the account (status: pending → active)  │
│                                                                 │
│  2. SELLER WITHDRAWS                                            │
│     • Clicks "Withdraw" in dashboard (min $10)                  │
│     • Platform calls create-payoneer-payout                     │
│     • Payoneer sends funds to seller's bank/card                │
│     • Arrives in 1-3 business days                              │
│                                                                 │
│  3. PAYONEER HANDLES                                            │
│     • 200+ countries supported                                  │
│     • Local bank transfers                                      │
│     • Prepaid Mastercard option                                 │
│     • Multi-currency accounts                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Countries Supported by Payoneer (but NOT Stripe Connect)

✅ Pakistan, Bangladesh, Nigeria, Kenya, Philippines, Vietnam, Egypt, Morocco, Ghana, Tanzania, Uganda, Nepal, Sri Lanka, and 150+ more

## To Complete the Integration

### Step 1: Get Payoneer Partner Account
1. Apply at https://www.payoneer.com/partners/
2. Get approved as a marketplace partner
3. Receive API credentials (Partner ID, API username/password, Program ID)

### Step 2: Add Secrets
Add these secrets to the project:
- `PAYONEER_PARTNER_ID`
- `PAYONEER_API_USERNAME`
- `PAYONEER_API_PASSWORD`
- `PAYONEER_PROGRAM_ID`

### Step 3: Test the Flow
Once credentials are added:
1. Seller enters Payoneer email
2. API registers them as payee
3. Status changes to "active" after Payoneer verification
4. Seller can request payouts

## Current UI in Settings > Billing

The Payoneer section is already in the UI showing:
- "Connect Payoneer" button when not connected
- Email input dialog
- Status badge (pending/active)
- Disconnect option

**No additional code changes needed** - just the API credentials!
