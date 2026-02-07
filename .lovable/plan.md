

# Logic-Locked Vibecoder: Pure Design Engine Implementation

## Problem Analysis

The current Vibecoder is producing "short" and "PDF-style" responses because:

1. **No Infrastructure Context Injection** — The AI doesn't receive a clear "Senior Creative Director" brief stating what's pre-provisioned (auth, payments, settings) and what its role is
2. **No Prompt Expansion Protocol** — Simple prompts like "shoe store" don't get inflated into high-density design specifications
3. **Commerce Binding is Optional** — The AI sometimes invents payment flows instead of using `useSellsPayCheckout()`
4. **Policy Guard is Reactive** — Violations are caught but don't redirect the AI's energy toward design

## Solution: Three-Layer Context Injection

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    LOGIC-LOCKED ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────┤
│  LAYER 1: ORCHESTRATOR                                              │
│  └─ Inject "SellsPay Infrastructure Context" before every prompt   │
│                                                                     │
│  LAYER 2: ARCHITECT                                                 │
│  └─ Add "Expansion Protocol" to inflate simple prompts             │
│                                                                     │
│  LAYER 3: BUILDER                                                   │
│  └─ Add "Commerce Binding" mandate for all Buy buttons             │
├─────────────────────────────────────────────────────────────────────┤
│  BONUS: POLICY GUARD                                                │
│  └─ Add redirect suggestions to guide users toward design tasks    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Orchestrator Infrastructure Injection

**File:** `supabase/functions/vibecoder-orchestrator/index.ts`

Inject a "SellsPay Infrastructure Context" block before every prompt so the AI knows what's solved and what its role is.

**Changes:**
- Add a constant `SELLSPAY_INFRASTRUCTURE_CONTEXT` block
- Prepend this to the prompt before sending to the Architect
- Include explicit table of what's PRE-PROVISIONED vs what's the AI's scope

**Infrastructure Context Block:**
```
### SELLSPAY MANAGED INFRASTRUCTURE (READ-ONLY)

You are a Senior UI Engineer on the SellsPay Platform.
The backend is FULLY MANAGED. You cannot build:

| Category      | Status    | Your Action                    |
|---------------|-----------|--------------------------------|
| Login/Signup  | SOLVED    | Not in scope                   |
| Payments      | SOLVED    | onClick={() => onBuy(id)}      |
| Settings      | SOLVED    | Not in scope                   |
| Database      | SOLVED    | Products passed via props      |

Your ENTIRE job is VISUAL DESIGN:
- Cinematic hero sections
- Editorial product grids
- Glassmorphism cards
- Framer Motion animations
- Premium typography
- Depth layering and shadows

When a user asks for "a store", they mean the FRONTEND.
Maximize visual complexity. Use every line for styling.
```

---

### Phase 2: Architect Expansion Protocol

**File:** `supabase/functions/vibecoder-architect/index.ts`

Add an "Expansion Protocol" section that transforms simple prompts into detailed design specifications.

**Changes:**
- Add `EXPANSION_PROTOCOL` section to system prompt
- Include mapping table: User Says -> Architect Expands To
- Mandate minimum visual complexity for every request

**Expansion Protocol:**
```
### EXPANSION PROTOCOL (MANDATORY)

Transform every user request into a LUXURY design specification:

| User Says           | You MUST Expand To                                    |
|---------------------|-------------------------------------------------------|
| "shoe store"        | Hero (3 gradient layers, text-9xl), asymmetric grid   |
|                     | (col-span-2 for featured), glassmorphism cards,       |
|                     | staggered reveal animations                           |
| "add products"      | Editorial grid refinement, varied aspect ratios,      |
|                     | hover scale+rotate, scroll-linked parallax            |
| "landing page"      | Full-bleed hero, stats bar, testimonials, featured    |
|                     | products, sticky nav with glass effect                |
| "make it premium"   | Typography upgrade (Playfair + Inter), ambient glow   |
|                     | orbs, text shimmer, magnetic button effects           |
| "sports brand"      | Athletic Luxury profile: horizontal parallax,         |
|                     | bold condensed fonts, high-contrast shadows           |

NEVER accept a simple request at face value.
Always inflate to maximum visual density.
```

---

### Phase 3: Builder Commerce Binding

**File:** `supabase/functions/vibecoder-builder/index.ts`

Add explicit "Commerce Binding" instructions so every Buy button uses the platform checkout.

**Changes:**
- Add `COMMERCE_BINDING_MANDATE` section
- Explicit instructions for onBuy prop pattern
- FORBIDDEN list for custom payment flows

**Commerce Binding Mandate:**
```
### COMMERCE BINDING (NON-NEGOTIABLE)

Every product MUST have an "onBuy" prop.
Every "Buy" / "Add to Cart" button MUST call:
  onClick={() => onBuy(product.id)}

The App.tsx MUST:
1. Import useSellsPayCheckout from './hooks/useSellsPayCheckout'
2. Destructure: const { buyProduct } = useSellsPayCheckout();
3. Pass to grid: <ProductGrid products={PRODUCTS} onBuy={buyProduct} />

FORBIDDEN:
- Creating custom payment forms
- Importing Stripe/PayPal directly
- Building auth pages
- Creating settings/profile pages
- Inventing new checkout flows

The payment system is SOLVED. Focus 100% on visual design.
```

---

### Phase 4: Policy Guard Redirect Suggestions

**File:** `src/utils/policyGuard.ts`

Enhance the PolicyRule interface to include redirect suggestions that guide users toward valid design tasks.

**Changes:**
- Add `redirect` property to `PolicyRule` interface
- Add constructive suggestions to each policy rule
- Update export to include redirect strings

**Updated Interface:**
```typescript
export interface PolicyRule {
  id: string;
  category: string;
  keywords: string[];
  message: string;
  redirect: string; // NEW: Suggested design task
}
```

**Example Redirect:**
```typescript
{
  id: 'auth_restriction',
  // ... existing fields
  redirect: "Try asking me to create a stunning hero section, product showcase, or landing page instead!"
}
```

---

## Technical Summary

| File | Change Type | Purpose |
|------|-------------|---------|
| `vibecoder-orchestrator/index.ts` | Add constant + inject | Prepend infrastructure context |
| `vibecoder-architect/index.ts` | Extend system prompt | Add Expansion Protocol |
| `vibecoder-builder/index.ts` | Extend system prompt | Add Commerce Binding mandate |
| `src/utils/policyGuard.ts` | Extend interface | Add redirect suggestions |

---

## Expected Outcomes

1. **No More "PDF-Style" Code** — Every simple prompt gets expanded into luxury specifications
2. **Zero Auth/Payment Confusion** — AI knows these are solved and focuses elsewhere
3. **Higher Visual Density** — 100% of token budget goes to gradients, motion, typography
4. **Faster Builds** — No wasted cycles trying to figure out backend infrastructure
5. **Better User Guidance** — Policy violations now suggest constructive alternatives

---

## Code Injection Summary

### Orchestrator: Infrastructure Context (prepend to every prompt)
```
### ═══════════════════════════════════════════════════════════════
### SELLSPAY MANAGED INFRASTRUCTURE (READ-ONLY)
### ═══════════════════════════════════════════════════════════════

You are a Senior UI Engineer on the SellsPay Platform.
The backend is FULLY MANAGED. You cannot build:
- Authentication (login/signup) → NOT IN SCOPE
- Payments → Use onClick={() => onBuy(id)}
- Settings/Billing → NOT IN SCOPE
- Database → Products passed via props

Your ENTIRE job is VISUAL DESIGN.
Maximize visual complexity. Use every line for styling.
```

### Architect: Expansion Protocol (add to system prompt)
```
### EXPANSION PROTOCOL (MANDATORY)

NEVER accept simple requests at face value.
ALWAYS inflate to maximum visual density.

"shoe store" → Hero (3 gradient layers, text-9xl), asymmetric grid, glassmorphism
"landing page" → Full-bleed hero, stats bar, testimonials, featured products
"sports brand" → Athletic Luxury: parallax, bold fonts, high-contrast shadows
```

### Builder: Commerce Binding (add to system prompt)
```
### COMMERCE BINDING (NON-NEGOTIABLE)

Every "Buy" button MUST use: onClick={() => onBuy(product.id)}
App.tsx MUST: import useSellsPayCheckout, pass buyProduct to grid
FORBIDDEN: Custom payment forms, Stripe imports, auth pages
```

