

# Direct Bank Account Payouts for Sellers

## Understanding the Payhip Screenshot

The image you shared shows **buyer payment methods** (Visa, Mastercard, PayPal, Discover) - these are the methods **buyers use to pay for products**. Your platform already supports all of these through Stripe Checkout, which automatically accepts:
- Visa
- Mastercard  
- American Express
- Discover
- Apple Pay / Google Pay
- PayPal (via your PayPal integration)

**The actual seller request is different**: They want to **receive payouts** to their bank accounts in countries where Stripe Connect and PayPal aren't available.

## Current Seller Payout Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│                    CURRENT PAYOUT OPTIONS                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Stripe Connect ───► Bank Account (via Stripe)               │
│  (46 countries)      └── Instant or Standard payouts         │
│                                                              │
│  PayPal ──────────► PayPal Balance                           │
│  (200+ countries)    └── Then withdraw to local bank         │
│                                                              │
│  Payoneer ─────────► (Partially implemented)                 │
│  (200+ countries)    └── Pending API integration             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## The Problem

Sellers in countries like:
- Pakistan, Bangladesh, Nigeria, Kenya, Philippines, Vietnam, Egypt, Morocco, etc.

Cannot use **Stripe Connect** (not available) and may have restrictions with PayPal. They need a way to enter their **local bank account details** (IBAN, SWIFT, or local account number) and receive payouts directly.

## Proposed Solution: Wise (TransferWise) Business API

Wise supports **payouts to 80+ currencies** and **bank accounts in 50+ countries** - including many not covered by Stripe Connect.

### How It Would Work

```text
┌─────────────────────────────────────────────────────────────────┐
│                    NEW PAYOUT FLOW WITH WISE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. SELLER CONNECTS BANK                                        │
│     ┌─────────────────────────────────────────┐                │
│     │  Country: [Nigeria         ▼]          │                │
│     │  Bank Name: [First Bank Nigeria]        │                │
│     │  Account Number: [1234567890]           │                │
│     │  Account Name: [John Doe]               │                │
│     │  SWIFT/BIC: [FBNING LA]                 │                │
│     └─────────────────────────────────────────┘                │
│                                                                 │
│  2. WITHDRAWAL REQUEST                                          │
│     • Seller clicks "Withdraw" (minimum $10)                    │
│     • Platform calls Wise API to create transfer                │
│     • Funds sent in local currency (NGN, PKR, etc.)            │
│     • Arrives in 1-3 business days                              │
│                                                                 │
│  3. WISE HANDLES                                                │
│     • Currency conversion (low fees ~0.5-1%)                    │
│     • International bank transfer                               │
│     • Compliance and verification                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Plan

### Phase 1: Database & Seller Config

**Update seller configuration** to store bank account details:
- Country code
- Currency
- Bank name
- Account number / IBAN
- Account holder name
- SWIFT / BIC code
- Routing number (for some countries)

### Phase 2: UI - Bank Account Form

**Add a "Direct Bank Transfer" option** in `PayoutMethodSelector.tsx`:
- Country dropdown (filtered to Wise-supported countries)
- Dynamic form fields based on country (each country has different requirements)
- Secure storage of bank details via RPC to `private.seller_config`
- Display connected bank info with masked account number

### Phase 3: Edge Function - Create Wise Payout

**New edge function**: `create-wise-payout`
- Authenticate seller
- Validate minimum withdrawal ($10)
- Get bank details from seller config
- Create quote via Wise API (shows exact amount in local currency)
- Create recipient (if not exists)
- Create and fund transfer
- Mark purchases as transferred
- Return transfer status and estimated arrival

### Phase 4: Wise API Integration

**Required Wise API calls:**
1. `POST /v2/profiles` - Get Wise profile ID
2. `POST /v2/quotes` - Get conversion quote (USD → local currency)
3. `POST /v1/accounts` - Create recipient account
4. `POST /v1/transfers` - Create transfer
5. `POST /v3/profiles/{profileId}/transfers/{transferId}/payments` - Fund transfer

### Required Secrets

The following secrets need to be configured:
- `WISE_API_KEY` - Wise Business API token
- `WISE_PROFILE_ID` - Your Wise business profile ID

---

## Technical Details

### Country-Specific Bank Fields

Different countries require different information:

| Country | Required Fields |
|---------|----------------|
| Nigeria | Account Number, Bank Code |
| Pakistan | IBAN |
| India | IFSC Code, Account Number |
| Philippines | Account Number, Bank Code |
| Bangladesh | Account Number, Bank Name |
| Kenya | Account Number, Bank Code |
| Europe (SEPA) | IBAN, BIC |
| USA | Routing Number, Account Number |

### Updated PayoutMethodSelector UI

The billing settings would show:

```text
┌──────────────────────────────────────────────────────────────┐
│  Payout Methods                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  💳 Stripe Connect              [Connected ✓]                │
│     Bank of America ****1234                                 │
│     Instant & standard payouts                               │
│                                                              │
│  🅿️ PayPal                      [Connected ✓]                │
│     john@example.com                                         │
│                                                              │
│  🏦 Direct Bank Transfer        [Connect Bank]               │ ← NEW
│     For countries not supported by Stripe                    │
│     Powered by Wise • 50+ countries                          │
│                                                              │
│  💰 Payoneer                    [Coming Soon]                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Files to Create/Modify

| File | Change |
|------|--------|
| `supabase/functions/create-wise-payout/index.ts` | New edge function for Wise payouts |
| `supabase/functions/check-wise-status/index.ts` | Check if bank is connected |
| `src/components/settings/PayoutMethodSelector.tsx` | Add bank account UI section |
| `src/components/settings/BankAccountForm.tsx` | New component for bank details form |
| `private.seller_config` | Add columns for bank details (via RPC) |

### Alternative: Complete Payoneer Integration

Your Payoneer edge functions are already partially built. Payoneer also supports:
- 200+ countries
- Local bank payouts
- Lower fees for high volume

If you already have a Payoneer partnership, we could finish that integration instead of adding Wise.

## Recommendation

**Start with Wise** because:
1. Simpler API than Payoneer
2. No complex merchant onboarding required
3. Sellers don't need a Wise account
4. Transparent, low fees
5. Wide country coverage including Pakistan, Nigeria, Philippines, Bangladesh, Kenya

Would you like me to proceed with implementing the Wise integration for direct bank payouts?

