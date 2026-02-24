

# VibeCoder Storefront Isolation Architecture

## Overview

This plan restructures VibeCoder to enforce strict folder isolation, namespaced routing, and commerce boundary protection. Users get unlimited UI creativity within `/storefront/**` while core commerce, checkout, auth, and admin logic remain untouchable.

## Current State

- AI generates files at arbitrary paths: `/App.tsx`, `/components/Hero.tsx`, `/sections/About.tsx`
- No folder restrictions in the ZERO-TRUST commit gate
- Published storefronts render via `AIStorefrontRenderer` using Sandpack with the full file map
- Profile route `/@username` conditionally renders the storefront or classic profile
- System prompt allows generating files anywhere

## Changes

---

### 1. Storefront Folder Enforcement (ZERO-TRUST Layer 7)

**Files to modify:**
- `supabase/functions/vibecoder-v2/index.ts`
- `src/components/ai-builder/hooks/useBackgroundGenerationController.ts`
- `src/components/ai-builder/transpileValidator.ts`

**What changes:**

Add a new validation layer (Layer 7: Path Isolation Guard) that runs after Layer 6 (transpile validation) and before the atomic commit.

Every file path in the file map must satisfy:
- Starts with `/storefront/` (or is exactly `/App.tsx` for backward compat during migration)
- Does not contain `../`
- Does not target restricted folders: `/core/`, `/checkout/`, `/auth/`, `/payments/`, `/settings/`, `/admin/`

A new helper function `validatePathIsolation(fileMap)` will be added to the transpile validator module and called in both:
- The backend edge function (server-side, during SUMMARY phase parsing)
- The frontend controller (client-side, as Layer 7 in the ZERO-TRUST gate)

Files that fail path isolation will cause the entire commit to abort (non-destructive, matching existing abort pattern).

---

### 2. Restructure Storefront File Layout

**Files to modify:**
- `supabase/functions/vibecoder-v2/index.ts` (system prompt: FILE STRUCTURE PROTOCOL section)
- `src/lib/vibecoder-stdlib.ts` (add storefront primitives)

**What changes:**

Update the `CODE_EXECUTOR_PROMPT` file structure protocol from:
```
/App.tsx
/components/NavBar.tsx
/sections/Hero.tsx
```
To:
```
/storefront/Layout.tsx       -- Main layout wrapper
/storefront/routes/Home.tsx  -- Home page
/storefront/routes/ProductPage.tsx
/storefront/routes/[Custom].tsx
/storefront/components/*.tsx -- Reusable UI
/storefront/theme.ts         -- Theme tokens
/App.tsx                      -- Router shell (auto-generated, read-only template)
```

The AI may create new files under `/storefront/routes/` (e.g., `Contact.tsx`, `About.tsx`, `FAQ.tsx`, `CampaignLanding.tsx`) but may NOT modify the routing engine itself.

The `/App.tsx` will be a fixed template that dynamically imports from `/storefront/` -- the AI cannot rewrite it from scratch; only the storefront layer is editable.

---

### 3. Namespaced Routing (`/@username/*`)

**Files to modify:**
- `src/App.tsx` (update route definition)
- `src/components/profile/AIStorefrontRenderer.tsx` (add dynamic route mounting)

**What changes:**

The current `/@username` route already exists and conditionally renders `AIStorefrontRenderer`. This plan enhances it to:

1. Keep `<Route path="/:atUsername/*" element={<AtUsernameRoute />} />` -- the wildcard `*` is already implicit
2. Inside `AIStorefrontRenderer`, mount a nested router that maps storefront route files dynamically:
   - `/` renders `routes/Home.tsx`
   - `/about` renders `routes/About.tsx`
   - etc.
3. Core routes (`/product/:slug`, `/checkout`) remain in the main app router -- never inside the storefront sandbox

Since storefronts run in Sandpack (isolated iframe), the actual route mounting happens inside the Sandpack environment. The AI-generated `/App.tsx` template will contain the internal routing for storefront pages.

No changes to the main app router are needed beyond confirming the wildcard catch works.

---

### 4. Commerce Boundary in System Prompt

**Files to modify:**
- `supabase/functions/vibecoder-v2/index.ts` (system prompts)

**What changes:**

Add a new section to `CODE_EXECUTOR_PROMPT`:

```
COMMERCE BOUNDARY (ABSOLUTE)
AI may: Customize UI, style components, create pages, create product layouts
AI may NOT: Implement payments, override checkout, add payment providers,
            modify Stripe/commission logic, add server endpoints, create API routes
```

Also update `REFUSE_EXECUTOR_PROMPT` to include commerce boundary violations alongside the existing nav-above-hero refusal.

Add commerce keywords to the intent classifier's REFUSE detection: `stripe`, `paypal`, `payment gateway`, `api endpoint`, `server route`, `webhook`.

---

### 5. Core UI Primitives (Stdlib Expansion)

**Files to modify:**
- `src/lib/vibecoder-stdlib.ts`

**What changes:**

Add pre-built, read-only components that the AI can compose:

```
/storefront/primitives/ProductGrid.tsx
/storefront/primitives/ProductCard.tsx
/storefront/primitives/BuyButton.tsx
/storefront/primitives/FeaturedProducts.tsx
/storefront/primitives/UserHeader.tsx
/storefront/primitives/StoreThemeProvider.tsx
```

These will be injected into `VIBECODER_STDLIB` so they are always available in the Sandpack environment. The AI's system prompt will instruct it to import from `@/storefront/primitives/` rather than recreating commerce logic.

Each primitive delegates to `useSellsPayCheckout()` internally, ensuring all commerce flows through the managed marketplace.

---

### 6. Migration Path (Backward Compatibility)

**What changes:**

Existing projects have files at `/App.tsx`, `/sections/Hero.tsx`, `/components/NavBar.tsx`. These must continue to work.

Strategy:
- The path isolation guard will have a **migration mode**: if the project's `last_valid_files` contains legacy paths (files outside `/storefront/`), the guard allows the existing structure but logs a deprecation warning
- New projects (no `last_valid_files`) will enforce `/storefront/` from the start
- A future migration script can relocate legacy files, but this is out of scope for this change

This ensures zero breakage for existing users while all new builds follow the isolated structure.

---

### 7. Shared Runtime Confirmation

No per-user sandbox infrastructure. No separate bundles. The architecture remains:
- Sandpack iframe renders the user's file map dynamically
- The host app (`AIStorefrontRenderer`) injects the stdlib + file map
- All storefronts share the same React runtime, Tailwind CDN, and dependency set
- Performance optimization: stdlib files are static constants (cached in memory)

---

### 8. Multi-Model Orchestration Compatibility

All changes are additive and do not modify the existing:
- Intent classifier pipeline
- Planner/executor routing
- Compile-fix retry loop
- Structural diff guards

The path isolation guard is a new validation layer that slots into the existing 6-layer gate as Layer 7. The system prompt changes are confined to the `CODE_EXECUTOR_PROMPT` constant.

---

## Technical Details

### New Validation Function

```typescript
// In transpileValidator.ts
const RESTRICTED_PREFIXES = [
  '/core/', '/checkout/', '/auth/', '/payments/',
  '/settings/', '/admin/', '/api/'
];

export function validatePathIsolation(
  files: Record<string, string>,
  legacyMode: boolean = false
): { valid: boolean; errors: Array<{ file: string; error: string }> } {
  const errors = [];
  for (const path of Object.keys(files)) {
    if (path.includes('..')) {
      errors.push({ file: path, error: 'Path traversal detected' });
      continue;
    }
    if (RESTRICTED_PREFIXES.some(p => path.startsWith(p))) {
      errors.push({ file: path, error: 'Targets restricted folder' });
      continue;
    }
    // In strict mode, must be under /storefront/ or be /App.tsx
    if (!legacyMode && !path.startsWith('/storefront/') && path !== '/App.tsx') {
      errors.push({ file: path, error: 'File must be under /storefront/' });
    }
  }
  return { valid: errors.length === 0, errors };
}
```

### Updated ZERO-TRUST Gate Order

1. JSON parse
2. Valid file map object
3. All values are strings
4. No conversational signatures
5. Export default in App.tsx
6. Transpile validation (syntax)
7. **Path isolation guard** (new)
8. Atomic DB-first commit

### System Prompt File Structure Update

The FILE STRUCTURE PROTOCOL section (lines ~1014-1026) will be replaced with the new storefront-aware structure, and a COMMERCE BOUNDARY section will be added after the MARKETPLACE PROTOCOL section.

### Stdlib Primitive Example

```typescript
// /storefront/primitives/BuyButton.tsx
import { useSellsPayCheckout } from '@/hooks/useSellsPayCheckout';

export function BuyButton({ productId, label = 'Buy Now' }) {
  const { buyProduct, isProcessing } = useSellsPayCheckout();
  return (
    <button onClick={() => buyProduct(productId)} disabled={isProcessing}>
      {isProcessing ? 'Processing...' : label}
    </button>
  );
}
```

---

## Summary of Files Changed

| File | Change |
|------|--------|
| `src/components/ai-builder/transpileValidator.ts` | Add `validatePathIsolation()` |
| `src/components/ai-builder/hooks/useBackgroundGenerationController.ts` | Add Layer 7 path isolation check |
| `supabase/functions/vibecoder-v2/index.ts` | Add server-side path isolation, update system prompts, add commerce boundary |
| `src/lib/vibecoder-stdlib.ts` | Add storefront primitives (ProductGrid, BuyButton, etc.) |
| `src/components/profile/AIStorefrontRenderer.tsx` | Minor: confirm storefront route support |

## What This Prevents

- AI generating files in `/checkout/`, `/auth/`, `/admin/` -- blocked by path isolation
- AI implementing custom payment logic -- blocked by commerce boundary in system prompt + REFUSE intent
- Path traversal attacks (`../../../core/`) -- blocked by `..` check
- Breaking existing projects -- legacy mode allows old file structures
- Revenue layer tampering -- all commerce flows through `useSellsPayCheckout()` primitives

