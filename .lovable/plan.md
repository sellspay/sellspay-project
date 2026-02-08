
# Dynamic Token-Based Credit System Overhaul

## Executive Summary
Transform the current flat-cost credit system into a **Lovable-style dynamic billing system** where costs scale with actual resource consumption. This includes a new 4-tier pricing structure, auto-model selection, usage logging, and a transparent "Vibe Meter" UI.

---

## Current State Analysis

### Existing Infrastructure
| Component | Status |
|-----------|--------|
| `user_wallets` table | ✅ Exists (user_id, balance, last_refill_at) |
| `wallet_transactions` table | ✅ Exists (tracks credit changes) |
| `subscription_plans` table | ✅ 3 plans (browser, creator, agency) |
| `deduct_credits` RPC | ✅ Secure deduction with row locking |
| Token usage logging | ❌ Not implemented |
| Dynamic cost calculation | ❌ Flat costs only |

### Current Credit Costs (Flat)
```text
vibecoder-pro: 3 credits (Premium model)
vibecoder-flash: 0 credits (Free tier)
reasoning-o1: 5 credits (Deep reasoning)
```

---

## Phase 1: Usage Logging Infrastructure

### New Database Table: `ai_usage_logs`
```sql
CREATE TABLE public.ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  session_id UUID, -- Groups related calls
  model_used TEXT NOT NULL,
  model_class TEXT, -- 'flash', 'standard', 'pro', 'flagship'
  modality TEXT, -- 'text', 'image', 'video'
  tokens_input INT DEFAULT 0,
  tokens_output INT DEFAULT 0,
  processing_time_ms INT,
  base_cost INT, -- Pre-multiplier cost
  multiplier DECIMAL(3,2) DEFAULT 1.0, -- For auto-mode, plans, etc.
  final_credits_deducted INT NOT NULL,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

This enables:
- Post-hoc auditing of AI costs
- Detecting if a model is costing more than charged
- Session-based attribution for multi-call workflows

---

## Phase 2: Dynamic Credit Calculation Engine

### Model Weight Table (Token-Based)
Replace flat costs with a **weight table** that calculates cost based on actual usage:

```text
┌─────────────────────────────────────────────────────────────────┐
│                    CREDIT WEIGHT TABLE (2026)                   │
├──────────────────────┬────────────┬─────────────────────────────┤
│ Action/Model         │ Base Cost  │ Notes                       │
├──────────────────────┼────────────┼─────────────────────────────┤
│ Gemini 3 Flash       │ 0.5-1 cr   │ $0.50/1M tokens - cheap     │
│ Gemini 3 Pro         │ 3-5 cr     │ $1.50/1M tokens - standard  │
│ GPT-5 / GPT-5.2      │ 5-10 cr    │ $2.00/1M tokens - flagship  │
│ Image Gen (Nano)     │ 5 cr       │ Flat per generation         │
│ Video Gen            │ 25+ cr     │ Per second generated        │
├──────────────────────┼────────────┼─────────────────────────────┤
│ "Plan" Feature       │ 2x mult    │ Uses more context tokens    │
│ Auto-Model Mode      │ 1.2x mult  │ Convenience fee             │
│ Retry (AI mistake)   │ 0.5x mult  │ Discount for AI errors      │
└──────────────────────┴────────────┴─────────────────────────────┘
```

### Calculation Logic
```text
final_cost = base_cost × (tokens_used / 1000) × plan_multiplier × mode_multiplier
```

---

## Phase 3: New 4-Tier Pricing Structure

### Tier Breakdown

| Tier | Price | Credits | AI Access | Auto-Mode | Fee |
|------|-------|---------|-----------|-----------|-----|
| **Starter** | $0 | 0 | None | ❌ | 10% |
| **Basic** | $25/mo | 500 | Flash models only | Manual | 8% |
| **Creator** | $100/mo | 2,500 | Pro + Image Gen | Basic Auto | 5% |
| **Agency** | $200/mo | 6,000 | All + Video | Full Auto | 0% |

### New Plan Features
- **Starter**: No AI - manual editor only
- **Basic**: Limited to fast/cheap models (Gemini 3 Flash)
- **Creator**: Unlocks GPT-5 and Gemini Pro, image generation
- **Agency**: Adds video generation, priority processing

---

## Phase 4: Top-Up Credit Packs

### Tiered Top-Up Pricing
Make subscriptions more attractive than top-ups:

| Top-Up | Credits | Price/Credit | Total |
|--------|---------|--------------|-------|
| Small | 150 | $0.066 | $10 |
| Medium | 1,000 | $0.050 | $50 |
| Large | 2,200 | $0.045 | $100 |

**Comparison**: The $100/mo Creator plan gives 2,500 credits at $0.04/credit plus Image Gen access.

### Database Table: `credit_packs`
```sql
CREATE TABLE public.credit_packs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  credits INT NOT NULL,
  price_cents INT NOT NULL,
  stripe_price_id TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Seed data
INSERT INTO credit_packs VALUES
  ('small', 'Small Pack', 150, 1000, NULL, true),
  ('medium', 'Medium Pack', 1000, 5000, NULL, true),
  ('large', 'Large Pack', 2200, 10000, NULL, true);
```

---

## Phase 5: Auto-Model Selection (Agency-Gated)

### Logic Flow
```text
┌─────────────────────────────────────────────────────────────────┐
│                    AUTO-MODEL SELECTION FLOW                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. User sends prompt                                           │
│                    ↓                                            │
│  2. Lightweight classifier (Gemini 3 Flash Lite) analyzes      │
│     complexity and recommends model                             │
│                    ↓                                            │
│  3. If plan = Basic → Force Flash models only                   │
│     If plan = Creator → Allow Standard + Pro                    │
│     If plan = Agency → Allow Flagship + Priority                │
│                    ↓                                            │
│  4. Apply 1.2x convenience multiplier for Auto-Mode             │
│                    ↓                                            │
│  5. Execute with selected model                                 │
│                    ↓                                            │
│  6. Calculate final cost from actual token usage                │
│                    ↓                                            │
│  7. Log to ai_usage_logs + deduct from wallet                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 6: "Vibe Meter" UI Component

### Pre-Generation Estimate
When user types a complex prompt, show a badge:
```
⚡ Estimated: 4-6 Credits
```

### Post-Generation Display
After completion, show actual cost:
```
✓ Used 5 credits (1,240 input + 820 output tokens)
```

### Component: `CreditEstimator`
- Hooks into `ChatInputBar`
- Analyzes prompt length + keywords
- Displays range estimate before sending
- Updates with actual cost after response

---

## Technical Implementation Summary

### Files to Create
1. `supabase/migrations/xxx_dynamic_credits.sql` - Database schema
2. `src/components/ai-builder/CreditEstimator.tsx` - UI estimate badge
3. `supabase/functions/calculate-credit-cost/index.ts` - Cost calculation logic

### Files to Modify
1. `supabase/functions/vibecoder-v2/index.ts` - Token tracking + dynamic deduction
2. `supabase/functions/deduct-ai-credits/index.ts` - Dynamic cost support
3. `src/hooks/useUserCredits.ts` - Add cost preview methods
4. `src/pages/Pricing.tsx` - Update to 4-tier structure
5. `src/components/ai-builder/VibecoderChat.tsx` - Integrate CreditEstimator
6. `supabase/functions/stripe-webhook/index.ts` - Handle new top-up packs

### Database Changes
1. Create `ai_usage_logs` table
2. Create `credit_packs` table
3. Add `basic` plan to `subscription_plans`
4. Add `auto_mode_enabled` column to `subscription_plans`
5. Update `deduct_credits` RPC to accept dynamic amounts

---

## Migration Path

### Phase Order
1. **Database**: Create new tables, add new plan
2. **Backend**: Update vibecoder-v2 to log usage and calculate dynamically
3. **Frontend**: Add Vibe Meter UI, update Pricing page
4. **Stripe**: Create new products/prices for Basic plan and top-up packs

### Backward Compatibility
- Existing users keep current credits
- Current flat costs remain as fallback
- New system activates per-request when enabled

---

## Expected Outcomes

After implementation:
- ✅ Credits feel "fair" - complex tasks cost more, simple edits are cheap
- ✅ Full audit trail of AI usage and costs
- ✅ Users can preview cost before generating
- ✅ Auto-mode provides convenience at premium
- ✅ Top-up packs available but subscriptions are better value
- ✅ 4-tier structure encourages upgrades
