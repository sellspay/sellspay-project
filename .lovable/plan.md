

# Plan: Add Payoneer and Direct Bank Transfer Withdrawal Options

## Overview

This plan addresses adding **Payoneer** as an alternative payout method alongside Stripe for international users, and implementing direct **bank/debit account routing** for withdrawals. This is a significant feature that requires careful consideration of technical implementation, compliance, and legal requirements.

---

## Current Architecture Assessment

Your platform currently uses:
- **Stripe Connect Express** for seller/editor payments
- 5% platform fee on all transactions
- Withdrawals via Stripe with standard (free, 1-3 days) and instant (3% fee) options
- Edge functions: `create-payout`, `get-stripe-balance`, `create-connect-account`

---

## Solution Architecture

```text
+------------------+     +------------------+     +------------------+
|   User Settings  | --> | Payout Method    | --> | Withdrawal       |
|   (Billing Tab)  |     | Selection        |     | Execution        |
+------------------+     +------------------+     +------------------+
                                |
          +---------------------+---------------------+
          |                     |                     |
    +-----v-----+         +-----v-----+         +-----v-----+
    |  Stripe   |         | Payoneer  |         | Direct    |
    |  Connect  |         | Mass Pay  |         | Bank/ACH  |
    +-----+-----+         +-----+-----+         +-----+-----+
          |                     |                     |
          v                     v                     v
    Auto via           API Integration        Stripe External
    Stripe Dashboard   (Business Account)     Accounts API
```

---

## Part 1: Payoneer Integration

### What You Need to Know

Payoneer offers a **Mass Payouts API** designed for marketplaces to pay sellers globally. This requires:

1. **Business Account**: Apply for a Payoneer Business account with Mass Payouts access
2. **API Credentials**: Partner ID, Username, API Password, Program ID
3. **Regulatory Approval**: Payoneer requires marketplace verification (KYC/AML compliance)

### Seller Experience

1. Seller chooses "Payoneer" as payout method in Settings > Billing
2. Seller enters their Payoneer email (existing Payoneer account) or signs up through your platform
3. Withdrawals route to their Payoneer balance
4. Seller can then withdraw from Payoneer to local bank, mobile money, etc.

### Technical Implementation

#### Database Changes
```sql
-- Add payout method columns to profiles table
ALTER TABLE profiles ADD COLUMN preferred_payout_method TEXT DEFAULT 'stripe';
ALTER TABLE profiles ADD COLUMN payoneer_email TEXT;
ALTER TABLE profiles ADD COLUMN payoneer_payee_id TEXT;
ALTER TABLE profiles ADD COLUMN payoneer_status TEXT;
```

#### New Edge Functions
- `register-payoneer-payee`: Register seller in your Payoneer program
- `create-payoneer-payout`: Execute payout via Payoneer API
- `check-payoneer-status`: Verify payee registration status

#### Required Secrets
- `PAYONEER_PARTNER_ID`
- `PAYONEER_API_USERNAME`
- `PAYONEER_API_PASSWORD`
- `PAYONEER_PROGRAM_ID`

### Fee Structure (Recommended)
- Standard Payoneer withdrawal: **Free** (1-3 business days)
- Payoneer itself charges recipients when withdrawing to local bank (~$1.50-3 depending on region)

---

## Part 2: Direct Bank/Debit Routing

### Two Approaches

#### Option A: Stripe External Accounts (Recommended)
Stripe Connect already supports adding bank accounts in 45+ countries. Users can link their bank during Stripe onboarding or add external accounts later.

- **Pros**: No new integration needed, uses existing Stripe infrastructure
- **Cons**: Limited to Stripe-supported countries

#### Option B: Separate ACH/Wire Integration
Use services like **Plaid + Moov** or **Dwolla** for direct US ACH transfers.

- **Pros**: More control, potentially lower fees
- **Cons**: Significant development effort, US-only initially, regulatory complexity

### Recommended Approach: Stripe External Accounts

Stripe Connect Express already allows users to:
1. Link bank accounts during onboarding
2. Add/change bank accounts via Customer Portal
3. Receive payouts directly to their bank

**Enhancement needed**: Add UI in Settings to explain this clearly and link to Stripe dashboard.

---

## Part 3: Privacy Policy Updates Required

Your Privacy Policy needs these additions:

### New Sections to Add

```markdown
## Payment Processing Partners

We use the following third-party payment processors:

### Stripe
- Purpose: Payment processing and seller payouts
- Data collected: Name, email, bank account details, tax identification
- Data location: United States, EU
- Privacy policy: https://stripe.com/privacy

### Payoneer (if/when implemented)
- Purpose: Alternative payout method for international sellers
- Data collected: Name, email, payout preferences, bank details
- Data location: Various (global presence)
- Privacy policy: https://www.payoneer.com/legal/privacy-policy/

## Financial Information

We collect and process the following financial data:
- Bank account details (account numbers, routing numbers)
- Payment history and transaction records
- Tax identification numbers (where required by law)
- Payout preferences and methods

This data is:
- Encrypted in transit and at rest
- Shared only with payment processors for transaction execution
- Retained as required by financial regulations (typically 7 years)
- Never sold to third parties

## International Data Transfers

For users outside the United States, your payment data may be transferred 
to and processed in:
- United States (Stripe headquarters)
- European Union (Stripe EU operations)
- Other jurisdictions where Payoneer operates

These transfers are protected by:
- Standard Contractual Clauses (SCCs)
- Adequacy decisions where applicable
- Our payment partners' data protection agreements
```

---

## Part 4: Terms of Service Updates Required

### New Sections to Add

```markdown
## 10. Payment Terms for Sellers

### Payout Methods
Sellers may choose from the following payout methods:
- **Stripe Connect**: Available in 45+ countries, direct bank deposits
- **Payoneer**: Available globally, supports local currency withdrawals

### Payout Fees
- Standard payouts (Stripe): Free, 1-3 business days
- Instant payouts (Stripe): 3% fee, immediate
- Payoneer payouts: Free from EditorsParadise; Payoneer may charge 
  withdrawal fees (see Payoneer terms)

### Payout Eligibility
To receive payouts, sellers must:
- Complete identity verification with chosen payment provider
- Maintain accurate banking/payout information
- Comply with applicable tax reporting requirements

### Minimum Payout Threshold
- Minimum withdrawal: $10 USD (or equivalent)
- Balance below minimum will roll over to next payout period

### Payout Schedule
- Earnings are available for withdrawal after a 7-day holding period
- This period allows for refund processing and fraud prevention

## 11. Tax Compliance

### Seller Responsibilities
Sellers are responsible for:
- Reporting income to appropriate tax authorities
- Providing accurate tax identification when required
- Complying with local tax laws in their jurisdiction

### Platform Reporting (US Sellers)
- We issue 1099-K forms to US sellers exceeding IRS thresholds
- Tax information is reported as required by law

### International Sellers
- We may collect tax identification (VAT, GST) as required
- Payoneer and Stripe may withhold taxes per local regulations
```

---

## Part 5: Implementation Phases

### Phase 1: Stripe Bank Account Clarity (1-2 days)
- Add clear messaging in Settings > Billing about bank account options
- Add "Manage Bank Account" button linking to Stripe Customer Portal
- Update documentation/help text

### Phase 2: Payoneer Integration (1-2 weeks)
- Apply for Payoneer Mass Payouts API access (requires business verification)
- Create database schema changes
- Build edge functions for Payoneer API
- Add Payoneer option in Settings UI
- Implement withdrawal flow for Payoneer

### Phase 3: Legal Updates (Before going live)
- Update Privacy Policy
- Update Terms of Service
- Add data processing agreements
- Consider consulting with a fintech-focused attorney

---

## UI/UX Changes Summary

### Settings > Billing Tab Updates

1. **Payout Method Selection Card**
   - Radio options: Stripe Connect | Payoneer
   - Show status badge for each (Connected, Pending, Not Set Up)

2. **Stripe Section** (existing, enhanced)
   - Current connection status
   - "Manage Account" button (goes to Stripe Express Dashboard)
   - "Update Bank Account" explanation

3. **Payoneer Section** (new)
   - Email input for Payoneer account
   - "Connect Payoneer" button
   - Status indicator

4. **Withdrawal Card**
   - Shows balance from selected method
   - Withdraw button with method-specific options
   - Fee explanations

---

## Important Considerations

### Regulatory/Compliance
- **Money Transmitter Licensing**: Using Stripe/Payoneer as processors means they hold the licenses, not you
- **KYC/AML**: Both processors handle this, but you should:
  - Store minimal financial data
  - Have clear audit trails
  - Report suspicious activity

### Payoneer API Access
- Requires applying as a **Payoneer for Platforms** partner
- Application process takes 2-4 weeks
- Requires business documentation and volume projections

### Currency Handling
- Stripe: Handles multi-currency automatically
- Payoneer: Excellent for international payouts, supports 150+ currencies

---

## Technical Considerations Summary

| Component | Technology | Complexity |
|-----------|-----------|------------|
| Payoneer API Integration | REST API, OAuth | Medium |
| Database Schema | 4-5 new columns | Low |
| Edge Functions | 3 new functions | Medium |
| UI Updates | Settings billing tab | Medium |
| Legal Documents | Privacy + Terms | Low (text) |

---

## Files to Create/Modify

### New Files
- `supabase/functions/register-payoneer-payee/index.ts`
- `supabase/functions/create-payoneer-payout/index.ts`
- `supabase/functions/check-payoneer-status/index.ts`
- `src/components/settings/PayoutMethodSelector.tsx`

### Modified Files
- `src/pages/Settings.tsx` (Billing tab enhancements)
- `src/pages/Privacy.tsx` (Legal updates)
- `src/pages/Terms.tsx` (Legal updates)
- `src/components/dashboard/EarningsCard.tsx` (Support multiple methods)

### Database Migration
- Add payout method columns to profiles table

