
## AI Builder Hardening: Reject Empty Ops & Force Complete Builds

This plan implements strict validation, quality gates, and repair loops to prevent useless empty responses from the AI. The system will no longer accept `{}` patches or empty asset requests.

---

## Step 1: Add Strict Schema Validation in Edge Function

### File: `supabase/functions/storefront-vibecoder/index.ts`

**Add new validation functions after line ~280:**

```text
NEW CODE TO ADD:
┌─────────────────────────────────────────────────────────────┐
│ validateThemePatch(patch)                                    │
│   - Reject if patch is {} or null                           │
│   - Require at least 1 valid key from:                      │
│     mode, accent, radius, spacing, font, background,        │
│     cardStyle, shadow                                       │
│   - Validate value types                                    │
│                                                              │
│ validateAssetRequests(requests)                              │
│   - Reject empty array with [{}]                            │
│   - Each request MUST have: kind, slot/purpose, style       │
│   - kind must be: image | icon_set | video_loop             │
│                                                              │
│ validateOpsNotEmpty(ops)                                     │
│   - Reject if ops.length === 0                              │
│   - Reject if only op is updateTheme with empty patch       │
│   - For fresh builds: require clearAllSections + 5+ blocks  │
└─────────────────────────────────────────────────────────────┘
```

### Validation Logic:

**ThemePatch validation:**
- `mode` must be "dark" | "light"
- `accent` must be valid hex color (#RRGGBB)
- `radius` must be number 0-24
- `spacing` must be "compact" | "balanced" | "roomy"
- `font` must be "inter" | "geist" | "system" | "serif"

**Asset request validation:**
- `kind` required: "image" | "icon_set" | "video_loop"
- `spec.purpose` required (non-empty string)
- `spec.style` required (non-empty string)

---

## Step 2: Add Quality Gate for Storefronts

### File: `supabase/functions/storefront-vibecoder/index.ts`

**Add quality gate function:**

When user prompt contains storefront keywords AND canvas is empty, the final output MUST include:

| Block Type | Requirement |
|------------|-------------|
| `hero` OR `headline` | At least 1 |
| `featured_products` OR `collection` OR `basic_list` | At least 1 |
| `testimonials` OR `stats` | At least 1 |
| `faq` OR `cta_strip` | At least 1 |
| **Total blocks** | Minimum 5 |

If the quality gate fails → trigger repair loop.

---

## Step 3: Add `replaceAllBlocks` Op Support

### Files to update:
- `supabase/functions/storefront-vibecoder/index.ts` - Add to VALID_OPS
- `src/components/profile-editor/vibecoder/types.ts` - Add type
- `src/components/profile-editor/vibecoder/hooks/useVibecoderOperations.ts` - Handle op

**New operation schema:**
```typescript
interface ReplaceAllBlocksOp {
  op: 'replaceAllBlocks';
  blocks: Array<{
    id: string;
    type: string;
    props: Record<string, unknown>;
  }>;
}
```

This replaces `clearAllSections` + multiple `addSection` with a single atomic operation.

---

## Step 4: Strict Repair Loop

### File: `supabase/functions/storefront-vibecoder/index.ts`

**Enhance the repair logic (around line 988-999):**

Current: Only repairs if schema validation fails.

New behavior:
1. Check for empty ops → FAIL immediately
2. Check for empty theme patch → FAIL immediately
3. Check for empty asset requests `[{}]` → Strip or FAIL
4. Check quality gate → FAIL if not met
5. On any FAIL → repair loop with explicit error message
6. After 1 retry → fallback to hardcoded premium default

**Repair prompt enhancement:**
```text
ADD TO REPAIR_PROMPT:
"You returned empty ops / empty theme patch. This is INVALID.
You MUST return non-empty ops that produce visible changes.
For build requests, you MUST create blocks using clearAllSections + addSection.
Empty {} patches or {} asset requests are forbidden."
```

---

## Step 5: Update Tool Contract Prompt

### File: `supabase/functions/storefront-vibecoder/index.ts`

**Add to `OPS_GENERATOR_PROMPT` (line ~115):**

```text
ADD TO SYSTEM PROMPT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VALIDATION RULES (HARD FAIL):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Empty {} patches are INVALID
- Empty {} asset requests are INVALID  
- ops.length === 0 is INVALID
- updateTheme with empty patch {} is INVALID

For "build" requests, you MUST:
1. Use clearAllSections first
2. Add 5-6 complete sections
3. Include real, compelling copy

If you cannot comply, return a complete rebuild.
Never ask questions before producing a first build.
```

---

## Step 6: Block Type Mapping (Legacy Compatibility)

### File: `supabase/functions/storefront-vibecoder/index.ts`

**Add block type aliasing:**

The AI might output new block types (`hero`, `bento_grid`) but the Free Builder uses legacy types (`headline`, `basic_list`). Add mapping:

```typescript
const BLOCK_TYPE_ALIASES: Record<string, string> = {
  'hero': 'headline',
  'bento_grid': 'basic_list',
  'cta_strip': 'headline',
  'stats': 'basic_list',
  'about': 'about_me',
  'featured_products': 'featured_product',
};
```

Apply this mapping in the validation/sanitization step.

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/storefront-vibecoder/index.ts` | Add validation functions, quality gate, repair enhancement, prompt updates |
| `src/components/profile-editor/vibecoder/types.ts` | Add `ReplaceAllBlocksOp` type |
| `src/components/profile-editor/vibecoder/hooks/useVibecoderOperations.ts` | Handle `replaceAllBlocks` operation |

---

## Technical Implementation Details

### New Validation Functions:

```typescript
// Validate theme patch is not empty
function validateThemePatch(patch: any): { valid: boolean; error?: string } {
  if (!patch || typeof patch !== 'object') {
    return { valid: false, error: 'Theme patch is null/undefined' };
  }
  
  const validKeys = ['mode', 'accent', 'radius', 'spacing', 'font', 'background', 'cardStyle', 'shadow'];
  const presentKeys = Object.keys(patch).filter(k => validKeys.includes(k) && patch[k] !== undefined);
  
  if (presentKeys.length === 0) {
    return { valid: false, error: 'Theme patch is empty - must change at least one property' };
  }
  
  // Validate specific values
  if (patch.mode && !['dark', 'light'].includes(patch.mode)) {
    return { valid: false, error: `Invalid mode: ${patch.mode}` };
  }
  if (patch.accent && !/^#[0-9A-Fa-f]{6}$/.test(patch.accent)) {
    return { valid: false, error: `Invalid accent color: ${patch.accent}` };
  }
  if (patch.radius !== undefined && (typeof patch.radius !== 'number' || patch.radius < 0 || patch.radius > 24)) {
    return { valid: false, error: `Invalid radius: ${patch.radius}` };
  }
  
  return { valid: true };
}

// Validate asset requests are not empty
function validateAssetRequests(requests: any[]): { valid: boolean; sanitized: any[]; error?: string } {
  if (!Array.isArray(requests)) {
    return { valid: true, sanitized: [] };
  }
  
  // Filter out empty objects
  const filtered = requests.filter(r => 
    r && typeof r === 'object' && Object.keys(r).length > 0
  );
  
  // Validate each remaining request
  for (const req of filtered) {
    if (!req.kind || !['image', 'icon_set', 'video_loop'].includes(req.kind)) {
      return { valid: false, sanitized: [], error: `Invalid asset kind: ${req.kind}` };
    }
    if (!req.spec?.purpose || !req.spec?.style) {
      return { valid: false, sanitized: [], error: 'Asset request missing purpose or style' };
    }
  }
  
  return { valid: true, sanitized: filtered };
}

// Check if ops are meaningful (not just empty operations)
function validateOpsNotEmpty(ops: any[]): { valid: boolean; error?: string } {
  if (!Array.isArray(ops) || ops.length === 0) {
    return { valid: false, error: 'No operations provided' };
  }
  
  // Check for "all empty" scenario
  const meaningfulOps = ops.filter(op => {
    if (op.op === 'updateTheme') {
      const patch = op.patch || op.value;
      return patch && Object.keys(patch).length > 0;
    }
    if (op.op === 'addSection' || op.op === 'clearAllSections' || op.op === 'replaceAllBlocks') {
      return true;
    }
    return true;
  });
  
  if (meaningfulOps.length === 0) {
    return { valid: false, error: 'All operations are empty/no-op' };
  }
  
  return { valid: true };
}
```

### Quality Gate Function:

```typescript
function checkStorefrontQualityGate(ops: any[]): { passed: boolean; missing: string[] } {
  const hasClear = ops.some(op => op.op === 'clearAllSections' || op.op === 'replaceAllBlocks');
  if (!hasClear) return { passed: true, missing: [] }; // Not a fresh build
  
  const addedTypes = new Set<string>();
  ops.forEach(op => {
    if (op.op === 'addSection' && op.section?.section_type) {
      addedTypes.add(op.section.section_type);
    }
    if (op.op === 'replaceAllBlocks' && Array.isArray(op.blocks)) {
      op.blocks.forEach((b: any) => addedTypes.add(b.type));
    }
  });
  
  const missing: string[] = [];
  
  // Must have hero
  if (!addedTypes.has('headline') && !addedTypes.has('hero')) {
    missing.push('hero/headline');
  }
  
  // Must have products section
  if (!addedTypes.has('featured_product') && !addedTypes.has('collection') && !addedTypes.has('basic_list')) {
    missing.push('products/features section');
  }
  
  // Must have social proof
  if (!addedTypes.has('testimonials') && !addedTypes.has('stats') && !addedTypes.has('about_me')) {
    missing.push('social proof (testimonials/stats)');
  }
  
  // Must have conversion element
  if (!addedTypes.has('faq') && !addedTypes.has('cta_strip')) {
    missing.push('faq or cta');
  }
  
  // Must have minimum 5 sections
  if (addedTypes.size < 5) {
    missing.push(`need ${5 - addedTypes.size} more sections (have ${addedTypes.size})`);
  }
  
  return { passed: missing.length === 0, missing };
}
```

---

## Expected Outcome

After implementation:

**Before (accepted as "success"):**
```json
{
  "ops": [{"op": "updateTheme", "patch": {}}],
  "asset_requests": [{}]
}
```

**After (REJECTED, triggers repair):**
- Empty theme patch → FAIL
- Empty asset request → Stripped
- No blocks added → FAIL
- Repair loop called with explicit errors
- If repair fails → hardcoded premium fallback returned

**Correct output structure:**
```json
{
  "ops": [
    { "op": "clearAllSections" },
    { "op": "addSection", "section": { "section_type": "headline", "content": {...}, "style_options": {...} }},
    { "op": "addSection", "section": { "section_type": "basic_list", ... }},
    { "op": "addSection", "section": { "section_type": "testimonials", ... }},
    { "op": "addSection", "section": { "section_type": "about_me", ... }},
    { "op": "addSection", "section": { "section_type": "faq", ... }},
    { "op": "updateTheme", "patch": { "mode": "dark", "accent": "#8B5CF6", "radius": 16 }}
  ],
  "asset_requests": [
    { "kind": "image", "spec": { "purpose": "hero background", "style": "luxury dark gradient" }}
  ]
}
```
