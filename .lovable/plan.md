

# Seller Custom Email Integration Plan

## Overview
Enable sellers to connect their own Resend account for sending emails to customers. This includes purchase receipts, support replies, and product update announcements - all sent from the seller's own verified domain.

## How It Works

Sellers will go to Settings and enter their Resend API key. When they send emails to customers (purchase confirmations, support replies, product updates), the system will use their API key to send from their verified domain instead of the platform's default.

---

## Implementation Steps

### Step 1: Database Schema Update
Add secure storage for seller email configuration in the `profiles` table:
- `resend_api_key_encrypted` (text) - Encrypted API key using Supabase Vault
- `seller_support_email` (text) - The email address for sending (must match their Resend verified domain)
- `seller_email_verified` (boolean) - Whether their email setup has been verified

Create a secure function to store the API key encrypted:
```text
┌────────────────────────────────────────────────────────────────┐
│  vault.create_secret(api_key, 'resend_key_<user_id>')          │
│                            ↓                                    │
│  Store secret_id reference in profiles.resend_vault_secret_id  │
└────────────────────────────────────────────────────────────────┘
```

### Step 2: Settings UI - Email Configuration Section
Add a new "Seller Email" section in Settings (visible only to sellers):
- Input field for Resend API Key (masked/secure input)
- Input field for "From" email address (e.g., support@theirbusiness.com)
- "Verify & Save" button that tests the API key
- Status indicator showing connection status
- Help text explaining how to get a Resend API key and verify a domain

### Step 3: API Key Verification Edge Function
Create `verify-seller-email` edge function that:
1. Takes the seller's Resend API key and email address
2. Attempts to send a test email to verify the key works
3. Stores the encrypted API key in Supabase Vault on success
4. Returns verification status

### Step 4: Unified Email Sending Function
Create `send-seller-email` edge function that:
1. Checks if seller has a configured Resend API key
2. If yes → use seller's API key and from address
3. If no → fall back to platform's default Resend account
4. Supports multiple email types: receipts, support, announcements

### Step 5: Purchase Receipt Emails
Update the purchase/checkout flow to trigger an email:
- Sent from seller's configured email (or platform default)
- Includes: product name, download link, receipt details
- Branded with seller's name and logo

### Step 6: Support Reply System
Create infrastructure for seller-to-customer communication:
- New `support_messages` table for tracking conversations
- Sellers can view messages in Dashboard
- Reply sends email via seller's Resend account
- Track delivery status

### Step 7: Product Update Announcements
Add ability for sellers to notify customers who purchased:
- "Notify Customers" button on product edit page
- Sends to all users who purchased that product
- Uses seller's email configuration

---

## Technical Details

### Database Changes
```text
profiles table:
  + resend_vault_secret_id (uuid)     -- Reference to encrypted API key in Vault
  + seller_support_email (text)        -- Verified "from" email address
  + seller_email_verified (boolean)    -- Email setup verification status

New table - support_messages:
  - id (uuid)
  - seller_profile_id (uuid)
  - customer_profile_id (uuid)
  - product_id (uuid, nullable)
  - subject (text)
  - message (text)
  - direction ('inbound' | 'outbound')
  - status ('sent' | 'delivered' | 'failed')
  - created_at (timestamp)
```

### Edge Functions to Create
1. `verify-seller-email` - Validate and store API key
2. `send-seller-email` - Unified email sending with seller key lookup
3. `send-purchase-receipt` - Triggered after successful purchase
4. `send-product-announcement` - Notify customers of product updates

### Security Considerations
- API keys stored encrypted using Supabase Vault (pgsodium)
- RLS policies ensure sellers can only access their own email settings
- Edge functions use service role to decrypt keys securely
- API key never exposed to frontend after initial submission

### Files to Create/Modify
- **Database migration** - Add columns and support_messages table
- `src/pages/Settings.tsx` - Add Seller Email configuration section
- `supabase/functions/verify-seller-email/index.ts` - New function
- `supabase/functions/send-seller-email/index.ts` - New function  
- `supabase/functions/send-purchase-receipt/index.ts` - New function
- `supabase/functions/create-checkout-session/index.ts` - Trigger receipt on purchase
- `src/pages/Dashboard.tsx` - Add support messages section (optional Phase 2)

---

## User Experience Flow

1. **Seller opens Settings → Seller Email tab**
2. **Enters their Resend API key** (with link to Resend signup/docs)
3. **Enters their verified "from" email** (e.g., hello@mystore.com)
4. **Clicks "Verify & Connect"** → System tests the key
5. **Success toast** → "Email connected! Customers will receive emails from hello@mystore.com"
6. **Going forward:**
   - Purchase receipts sent from their email
   - Can send product announcements from Dashboard
   - Support replies use their email

---

## Phased Rollout Suggestion

**Phase 1 (This Implementation):**
- Settings UI for API key configuration
- Verification edge function
- Purchase receipt emails from seller's account

**Phase 2 (Future):**
- Support messaging system in Dashboard
- Product update announcement feature
- Email analytics/delivery tracking

