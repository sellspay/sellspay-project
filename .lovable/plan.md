

# Merchant of Record (MoR) Legal Infrastructure Update

## Overview

This plan updates SellsPay's legal pages and checkout flow to properly establish the platform as the **Marketplace Facilitator and Merchant of Record**. This protects you from global tax registration requirements and clarifies liability.

---

## What's Already In Place

| Component | Status |
|-----------|--------|
| `/terms` page | Exists, needs MoR section |
| `/privacy` page | Exists, needs data processor language |
| `/refunds` page | Exists, needs MoR-focused language |
| Footer links | Already links to all 3 pages |
| Checkout flow | Exists, missing legal checkbox |

---

## Changes to Make

### 1. Terms of Service (`/terms`) - Add Merchant of Record Section

Add a new prominent section at the top (after "Acceptance of Terms") that establishes SellsPay as the Merchant of Record:

**New Section: "Marketplace Role & Merchant of Record"**
- Establishes SellsPay as the Marketplace Facilitator and Merchant of Record
- Clarifies that transactions are legally between customer and SellsPay
- Explains seller agency relationship (sellers appoint SellsPay as agent)
- States SellsPay handles tax collection/remittance
- Explains why "SELLSPAY" appears on bank statements

---

### 2. Privacy Policy (`/privacy`) - Add Data Processor Language

Update the "Information We Collect" section to clarify:

**Updates to Section 2:**
- Explain that as Merchant of Record, SellsPay collects buyer data
- Clarify what is shared with sellers (name, email for delivery/support only)
- Reference third-party processors (Stripe) for payment handling
- Add transaction retention for tax compliance (1099-K reporting)

---

### 3. Refund Policy (`/refunds`) - MoR Language

Update the overview section to reflect that:

**Updates to Overview:**
- All refunds are handled by SellsPay (not individual sellers)
- Platform fee policy on refunds (SellsPay retains 5% fee on refunds at its discretion)
- Seller-initiated refunds revoke access

---

### 4. Checkout Flow - Clickwrap Agreement

Add a mandatory checkbox before payment that users must check:

**Checkbox text:**
"I agree to SellsPay's Terms of Service and Refund Policy"

- Links to `/terms` and `/refunds`
- Required to enable the payment button
- Creates a legally binding "clickwrap" agreement

---

## Technical Details

### Files to Modify

```text
src/pages/Terms.tsx
├── Add new Section 2: "Marketplace Role & Merchant of Record"
├── Move existing sections down (renumber 2→3, 3→4, etc.)
└── Add tax collection/remittance language

src/pages/Privacy.tsx
├── Update Section 2: "Information We Collect"
├── Add subsection: "Merchant of Record Data Collection"
└── Add transaction retention for tax compliance

src/pages/Refunds.tsx
├── Update Overview section with MoR language
└── Add platform fee handling on refunds

src/components/checkout/PaymentMethodDialog.tsx
├── Add state: termsAccepted (boolean)
├── Add Checkbox component with links
└── Disable payment button until checkbox is checked
```

### Checkout Checkbox Implementation

The checkout dialog will be updated with:

1. A `useState` hook for tracking acceptance:
   ```typescript
   const [termsAccepted, setTermsAccepted] = useState(false);
   ```

2. A checkbox component above the payment button:
   ```text
   [ ] I agree to SellsPay's Terms of Service and Refund Policy
         ↑ links open in new tab
   ```

3. Payment button disabled until `termsAccepted === true`

---

## Legal Content to Add

### Terms of Service - New Section (after Acceptance)

**Section 2: Marketplace Role & Merchant of Record**

> SellsPay operates as a **Marketplace Facilitator** and **Merchant of Record (MoR)** for all transactions conducted through the platform. When a customer purchases a digital product, the transaction is legally between the customer and SellsPay.
>
> **For Sellers:** You appoint SellsPay as your agent to sell your digital products. While you retain ownership of your content, SellsPay is responsible for processing payments, collecting applicable sales tax/VAT, and handling initial billing support.
>
> **For Buyers:** Your financial transaction is with SellsPay. This is why "SELLSPAY" will appear on your bank or credit card statement.
>
> **Tax Collection:** SellsPay collects and remits sales tax on your behalf where required by law. Sellers are not required to register for sales tax in individual jurisdictions.

### Privacy Policy - Updated Section

**Information We Collect & How It's Shared**

> Because SellsPay acts as the Merchant of Record, we collect personal information (such as name, email address, and IP address) to process payments, prevent fraud, and calculate taxes.
>
> **Sharing with Sellers:** We share the buyer's name and email with the specific Seller whose product was purchased to allow for product delivery and customer support.
>
> **Third-Party Processors:** Your payment data is handled securely by Stripe. SellsPay does not store your full credit card details on our servers.
>
> **Compliance:** We retain transaction records as required by law for tax reporting (e.g., 1099-K reporting) and audit purposes.

### Refunds Policy - Updated Overview

> SellsPay is the Merchant of Record for all purchases. Refund requests are processed and approved by SellsPay. Due to the nature of digital downloads, all sales made through SellsPay are generally final and non-refundable once the digital content has been accessed or downloaded.
>
> **Exceptions:** Refunds may be granted at the sole discretion of SellsPay if the digital file is proven to be corrupt, defective, or significantly misdescribed by the seller.
>
> **Seller-Initiated Refunds:** Sellers may authorize a refund for a customer at their own discretion. If a refund is issued, the customer's access to the digital product will be immediately revoked.

---

## Summary

| Change | Purpose |
|--------|---------|
| MoR section in Terms | Legal protection for tax liability |
| Data processor language in Privacy | GDPR/compliance clarity |
| MoR language in Refunds | Clarifies refund authority |
| Clickwrap checkbox | Legally binding agreement |

