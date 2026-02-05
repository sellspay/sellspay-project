

# AI Vibecoder System Prompt Upgrade

## Overview

You've provided a comprehensive, production-ready system prompt specification for the Storefront Vibecoder. I'll update the edge function to replace the current basic prompt with your full specification, ensuring the AI behaves exactly as defined.

---

## Current State vs Your Spec

| Aspect | Current Implementation | Your Spec |
|--------|----------------------|-----------|
| System Prompt | ~60 lines, basic | Full 200+ line production spec |
| Block Registry | Mentioned in passing | Explicit list with schema notes |
| Failure Handling | Basic fallback | "Never say I can't" - graceful substitution |
| Profile Shell | Mentioned | Explicit "LOCKED" rules |
| Free vs Paid | Not mentioned | Clear tier behavior |
| Asset Generation | Basic | "Invisible presets" - no mention of templates |
| Design Quality Bar | Not enforced | Explicit premium standards |

---

## Implementation Plan

### 1. Replace Edge Function System Prompt

**File**: `supabase/functions/storefront-vibecoder/index.ts`

Replace the current `SYSTEM_PROMPT` with your full specification, including:

- **Core Product Model** - Profile Shell (locked) + Editable Canvas
- **Absolute Rules** - No HTML/CSS/JS, no billing access, always produce output
- **Block Registry** - All approved section types with schema notes
- **"Type Anything" Behavior** - Infer intent, translate to blocks, apply patches
- **Free vs Paid** - No mention of tiers in responses
- **Asset Generation** - Never say "preset", draft tray workflow
- **Output Format** - Strict JSON with ops, asset_requests, preview_notes
- **Design Quality Bar** - Premium, cohesive, intentional
- **Failure Handling** - Build closest equivalent, explain briefly

### 2. Enhance Tool Schema

Update the function calling schema to better align with your block registry:

```text
Section Types (explicit):
hero, featured_products, collections_row, bento_grid, image_section, 
video_section, testimonials, stats_strip, pricing, faq, comparison, 
cta_strip, icon_features, about_creator, email_capture, gallery, 
divider, spacer
```

**Note**: Some of your spec's block names (like `hero`, `bento_grid`, `stats_strip`, `cta_strip`, `comparison`, `pricing`) don't exist in the current type system. I'll map them to existing equivalents:

| Your Spec | Current System Equivalent |
|-----------|--------------------------|
| `hero` | `headline` or `image_with_text` with layout: 'hero' |
| `bento_grid` | `gallery` with custom layout |
| `stats_strip` | `basic_list` with horizontal layout |
| `cta_strip` | `image_with_text` with button emphasis |
| `comparison` | `basic_list` with cards layout |
| `pricing` / `offers` | `basic_list` or `featured_product` |
| `about_creator` | `about_me` |
| `email_capture` | `newsletter` |
| `icon_features` | `basic_list` with icon style |

### 3. Update Fallback Behavior

Current: Returns a generic "starter hero section" on failure

New: Follow your spec's **Failure Handling** rules:
- Never say "I can't" or "not possible"
- Build the closest supported equivalent
- Explain the substitution briefly
- Offer optional refinement

### 4. Tune Model Parameters

```text
Current: temperature: 1.05, top_p: 0.95
Keep: These are good for creative variation without losing coherence
```

---

## Technical Details

### Full System Prompt Structure

```text
1. ROLE DECLARATION
   "You are SellsPay's AI Vibecoder..."

2. CORE PRODUCT MODEL
   - Profile Shell (LOCKED)
   - Editable Canvas (free creativity)

3. ABSOLUTE RULES (7 rules)
   - Never output raw HTML/CSS/JS
   - Never inject scripts
   - Never modify billing/auth
   - Never break header shell
   - Never mention presets
   - Never refuse (build alternative)
   - Always produce something

4. BLOCK REGISTRY
   - Explicit list with equivalents to existing types
   - Schema notes for each

5. "TYPE ANYTHING" BEHAVIOR
   - Infer intent → Translate → Apply → Summarize → Keep undoable

6. ASSET GENERATION RULES
   - Never say "preset"
   - Draft tray workflow
   - Match brand profile

7. OUTPUT FORMAT
   - message, ops, asset_requests, preview_notes
   - All ops reversible and schema-safe

8. DESIGN QUALITY BAR
   - Intentional, cohesive
   - Respect spacing, hierarchy, contrast
   - Premium, modern, trustworthy

9. FAILURE HANDLING
   - Build closest equivalent
   - Explain briefly
   - Offer refinement
```

---

## Validation

After deploying, the Vibecoder will:

1. **Accept any natural language input** without asking clarifying questions
2. **Always produce valid patch operations** - never return empty ops
3. **Use premium language** - never mention "presets" or "templates"
4. **Handle failures gracefully** - build alternatives instead of refusing
5. **Maintain locked header** - only content changes to banner/avatar/bio/links
6. **Generate high-quality designs** - cohesive, premium, intentional

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/storefront-vibecoder/index.ts` | Replace `SYSTEM_PROMPT` with full spec, update tool schema descriptions |

---

## Summary

This upgrade transforms the Vibecoder from a basic co-pilot into the full production system you've specified. The AI will:

- Accept **any** natural language input
- **Always** produce results (never refuse)
- Use **premium** design standards
- **Never** expose internal mechanics (presets, templates)
- Follow **strict** output format

