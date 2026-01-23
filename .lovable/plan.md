

# Pro Tools Credit System Redesign Plan

## Overview
Transform the current subscription-based Pro Tools system into a flexible credit-based wallet system with tiered pricing plans, free starter credits for new users, and clear distinction between free and Pro tools.

---

## Current State Analysis
- **Existing System**: Subscription-based ($9.99/month for 50 uses)
- **Database Tables**: `pro_tool_subscriptions`, `tool_usage`
- **Edge Functions**: `create-pro-tools-checkout`, `check-pro-tools-subscription`
- **Pro Tools**: SFX Generator, Voice Isolator, SFX Isolator, Music Splitter
- **Free Tools**: Audio Cutter, Joiner, Recorder, Converter, Video to Audio, Waveform Generator

---

## New System Architecture

### Credit Wallet System
Users will have a credit balance stored in their profile. Credits are deducted when using Pro tools (1 credit per use). Free tools never deduct credits.

### Pricing Tiers

| Plan | Price | Credits | Value per Credit |
|------|-------|---------|------------------|
| Starter | $4.99 | 15 | $0.33 |
| Basic | $9.99 | 50 | $0.20 |
| Pro | $24.99 | 150 | $0.17 |
| Power | $49.99 | 350 | $0.14 |
| Enterprise | $99.99 | 800 | $0.12 |

### Free Credits
- All new signups receive **5 free credits** to try Pro tools
- Credits are granted automatically on first profile creation

---

## Database Changes

### 1. Add Credits Column to Profiles Table
```sql
ALTER TABLE profiles ADD COLUMN credit_balance integer DEFAULT 5;
```
New users automatically get 5 credits.

### 2. Create Credit Transactions Table
Track all credit purchases and usage for transparency:
```sql
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL, -- 'purchase', 'usage', 'bonus'
  amount INTEGER NOT NULL, -- positive for additions, negative for deductions
  description TEXT,
  tool_id TEXT, -- for usage transactions
  stripe_session_id TEXT, -- for purchase transactions
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3. Create Credit Packages Table
Store available credit packages:
```sql
CREATE TABLE credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  stripe_price_id TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Edge Functions

### 1. Update `check-pro-tools-subscription` -> `check-credits`
Replace subscription check with credit balance check:
- Return current credit balance from profiles
- Return usage history (optional)

### 2. Create `create-credit-checkout`
Create Stripe one-time payment checkout for credit packages:
- Accept package_id parameter
- Create Stripe Checkout session with one-time payment mode
- Store package details in metadata for webhook

### 3. Create `add-credits` (or update webhook)
Add credits after successful payment:
- Called by Stripe webhook or success page verification
- Add credits to user's balance
- Create transaction record

### 4. Create `deduct-credit`
Deduct credits when using Pro tools:
- Verify user has sufficient balance
- Deduct 1 credit
- Create usage transaction record
- Return new balance

---

## Frontend Changes

### 1. Header Navigation Update
**File**: `src/components/layout/Header.tsx`
- Add "Pricing" link to `navItems` array
- Add credit wallet display showing current balance (coin icon + number)
- Show wallet in user dropdown and/or as standalone element

### 2. New Pricing Page
**File**: `src/pages/Pricing.tsx`
- Hero section with value proposition
- Credit package cards with pricing tiers
- Feature comparison (what Pro tools include)
- FAQ section about credits
- Clear CTAs for each tier

### 3. Update Tools Sidebar
**File**: `src/components/tools/ToolsSidebar.tsx`
- Add credit wallet display at top of sidebar
- Add "Free" badge to non-Pro tools (in addition to existing "Pro" badges)
- Update tool descriptions to clarify credit usage

### 4. Update ProToolsGate Component
**File**: `src/components/tools/ProToolsGate.tsx`
- Replace subscription check with credit balance check
- Show remaining credits instead of usage count
- Update upgrade prompt to redirect to Pricing page
- Show "Get Credits" button instead of "Subscribe Now"
- Add "Top Up" quick action when credits are low

### 5. Update useProToolsSubscription Hook
**File**: `src/hooks/useProToolsSubscription.ts`
Rename to `useCredits.ts` with new logic:
- Fetch credit balance from profiles table
- `deductCredit(toolId)`: Call edge function to deduct
- `canUseTool(toolId)`: Check if free tool OR has credits
- Remove subscription-related logic
- Add `topUp()` function to navigate to pricing

### 6. Update ToolContent Component
**File**: `src/components/tools/ToolContent.tsx`
- Pass credit-related props to ProToolsGate
- Call deductCredit after successful Pro tool use

### 7. Credit Wallet Component
**File**: `src/components/credits/CreditWallet.tsx` (new)
- Animated coin icon
- Current balance display
- "Top Up" button
- Click to see transaction history (optional)

### 8. Add Route for Pricing Page
**File**: `src/App.tsx`
- Add `/pricing` route

---

## UI/UX Improvements

### Tools Page Redesign
1. **Sidebar Header**: Show credit wallet prominently
2. **Tool Badges**: 
   - Pro tools: Orange "Pro" badge + "1 credit" indicator
   - Free tools: Green "Free" badge + "Unlimited" indicator
3. **Credit Status Bar**: Show at top of content area for Pro tools

### Pricing Page Design
1. **Hero**: "Power Your Creativity with Credits"
2. **Package Cards**: 
   - Highlight best value (Pro tier)
   - Show savings percentage for larger packages
3. **Tool Preview**: Icons/names of all Pro tools included
4. **Trust Elements**: Credit icons, secure payment badges

---

## Implementation Order

### Phase 1: Database & Backend
1. Database migration for profiles (add credit_balance)
2. Create credit_transactions table
3. Create credit_packages table with initial data
4. Create Stripe products/prices for credit packages
5. Update/create edge functions

### Phase 2: Hook & State Management
1. Create new `useCredits` hook
2. Update ProToolsGate component
3. Update ToolContent to use new hook

### Phase 3: UI Components
1. Create CreditWallet component
2. Update ToolsSidebar with wallet and badges
3. Update Header with Pricing link and wallet
4. Create Pricing page

### Phase 4: Polish
1. Add success/error toasts for credit operations
2. Add loading states
3. Test edge cases (0 credits, failed payments, etc.)

---

## Technical Details

### Stripe Products to Create
| Package | Stripe Product | Price (cents) |
|---------|---------------|---------------|
| Starter 15 | prod_starter_credits | 499 |
| Basic 50 | prod_basic_credits | 999 |
| Pro 150 | prod_pro_credits | 2499 |
| Power 350 | prod_power_credits | 4999 |
| Enterprise 800 | prod_enterprise_credits | 9999 |

### Credit Balance Logic
```typescript
// Check if can use tool
const canUse = !isProTool(toolId) || creditBalance > 0;

// After successful Pro tool use
await supabase.functions.invoke('deduct-credit', { 
  body: { tool_id: toolId } 
});
```

### Free Credits on Signup
The `credit_balance DEFAULT 5` in the profiles table handles this automatically when the trigger creates a new profile on signup.

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/pages/Pricing.tsx` | Create | New pricing page with credit packages |
| `src/components/credits/CreditWallet.tsx` | Create | Wallet display component |
| `src/hooks/useCredits.ts` | Create | New credit management hook |
| `supabase/functions/check-credits/` | Create | Check user credit balance |
| `supabase/functions/create-credit-checkout/` | Create | Stripe checkout for credits |
| `supabase/functions/deduct-credit/` | Create | Deduct credit on Pro tool use |
| `src/components/layout/Header.tsx` | Modify | Add Pricing nav link, wallet display |
| `src/components/tools/ToolsSidebar.tsx` | Modify | Add wallet, Free badges |
| `src/components/tools/ProToolsGate.tsx` | Modify | Use credits instead of subscription |
| `src/components/tools/ToolContent.tsx` | Modify | Use new useCredits hook |
| `src/App.tsx` | Modify | Add /pricing route |
| `supabase/migrations/` | Create | Database schema changes |

