

# Conditional Injection for MODIFY Intent

## What Changes

**Single file**: `supabase/functions/vibecoder-v2/index.ts`

### 1. Add product keyword detection (~line 2780, before injection assembly)

Add a simple keyword list and detection function:

```typescript
const PRODUCT_KEYWORDS = [
  "product", "products", "pricing", "price", "store", "shop",
  "catalog", "checkout", "cart", "inventory", "sku",
  "subscription", "plan", "plans", "tier", "tiers"
];

function shouldInjectProducts(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return PRODUCT_KEYWORDS.some(keyword => lower.includes(keyword));
}
```

### 2. Branch the injection assembly at line 2813

Currently all intents get the same injection string. Change the MODIFY path to use a lean context:

**For MODIFY** (when `intent.intent === "MODIFY"`):
- Always include: `brandMemoryInjection`, `intentInjection`
- Conditionally include: `productsInjection` (only if prompt matches product keywords)
- Drop: `modeInjection`, `brandLayerInjection`, `creatorInjection`, `microInjection`

This reduces MODIFY injection from ~1,500-4,000 tokens down to ~400-800 tokens for non-product changes.

**For BUILD/FIX**: No change -- they keep the full injection suite.

### 3. Token savings breakdown

| Injection | Tokens | MODIFY keeps? |
|-----------|--------|---------------|
| brandMemoryInjection | ~300-600 | Yes (always) |
| intentInjection | ~50-100 | Yes (always) |
| productsInjection | ~1,000-3,000 | Only if product keywords detected |
| modeInjection | ~200 | No |
| brandLayerInjection | ~350 | No |
| creatorInjection | ~80 | No |
| microInjection | ~50 | No |

## What Does NOT Change

- BUILD injection (full suite)
- FIX injection (full suite)
- System prompts
- Stream parser
- Token guardrails
- Retry logic

