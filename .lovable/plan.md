
# Million Dollar Vibecoder: Premium Factory System

## Problem Analysis

The current Vibecoder has solid foundations but produces inconsistent quality because:

1. **No "Unique Design Feature" Mandate** — The Architect can plan generic layouts without a signature element
2. **No Navigation Component** — File manifest only plans 4 files, missing the sticky nav that makes sites feel complete
3. **Expansion Protocol is Passive** — Examples exist but aren't enforced with a "MINIMUM REQUIREMENTS" block
4. **No Quality Gate** — There's no complexity scoring that REJECTS low-density plans
5. **Builder Missing Typography Pairing Rules** — No explicit font hierarchy enforcement

## Solution: "Premium Factory" System Defaults

```text
┌─────────────────────────────────────────────────────────────────────┐
│                  MILLION DOLLAR VIBECODER                           │
├─────────────────────────────────────────────────────────────────────┤
│  1. ARCHITECT: Add "Unique Design Feature" REQUIREMENT              │
│     └─ Every plan MUST include a signature element                 │
│                                                                     │
│  2. ARCHITECT: Expand file manifest to 5-6 files                    │
│     └─ Add Navigation.tsx as MANDATORY                             │
│                                                                     │
│  3. ARCHITECT: Add "Quality Gate" scoring                           │
│     └─ Reject plans with complexity < 4                            │
│                                                                     │
│  4. BUILDER: Add Typography Pairing Rules                           │
│     └─ Explicit Playfair + Inter mandate                           │
│                                                                     │
│  5. BUILDER: Add "Micro-Interaction Checklist"                      │
│     └─ Every element must have hover/motion                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Details

### Phase 1: Architect "Premium Factory" Defaults

**File:** `supabase/functions/vibecoder-architect/index.ts`

Add a "MINIMUM QUALITY REQUIREMENTS" section to the system prompt:

```text
### MINIMUM QUALITY REQUIREMENTS (REJECT IF NOT MET)

Every blueprint MUST achieve a complexity score of 4+ (out of 5).
If the AI cannot meet these requirements, it MUST add more detail.

**MANDATORY FILE STRUCTURE (5-6 files):**
1. data/products.ts — Product data (max 6 items, high-res Unsplash)
2. components/Navigation.tsx — Sticky/glassmorphism nav with logo + links
3. components/Hero.tsx — Full-screen hero with 3+ gradient layers
4. components/ProductGrid.tsx — ASYMMETRIC editorial grid (NOT uniform)
5. App.tsx — Main orchestrator (imports + assembles, max 40 lines)
6. components/Footer.tsx — Optional but recommended

**UNIQUE DESIGN FEATURE (MANDATORY):**
Every plan MUST include a "uniqueDesignFeature" field with:
- element: The specific visual feature (e.g., "magnetic cursor buttons")
- implementation: Tailwind/CSS approach to achieve it

Examples of unique features:
- Scroll-triggered parallax layers with different speeds
- Text shimmer animation on hero heading
- Asymmetric grid with featured product spanning 2 columns
- Floating decorative blobs with organic animation
- Cursor-following radial glow effect
- Glassmorphism card stack with depth blur

**TYPOGRAPHY MANDATE:**
- Hero: MUST be text-7xl+ with font-serif or professional typeface
- Pairing: Heading serif + body sans-serif (e.g., Playfair + Inter)
- NEVER use default system fonts without explicit classes
```

---

### Phase 2: Builder "Micro-Interaction Checklist"

**File:** `supabase/functions/vibecoder-builder/index.ts`

Add a "MICRO-INTERACTION CHECKLIST" that enforces polish on every element:

```text
### MICRO-INTERACTION CHECKLIST (EVERY COMPONENT)

Before completing any component, verify these are present:

**Hero Section:**
- [ ] motion.h1 with initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
- [ ] Staggered subtitle/CTA with delay
- [ ] Background gradient with at least 3 layers
- [ ] CTA button with whileHover={{ scale: 1.05 }}

**Navigation:**
- [ ] fixed top-0 with backdrop-blur-xl
- [ ] Glassmorphism: bg-white/5 border-b border-white/10
- [ ] Links with hover underline animation

**Product Cards:**
- [ ] group class on wrapper for hover coordination
- [ ] Image with group-hover:scale-110 transition-transform duration-700
- [ ] overflow-hidden on image container
- [ ] hover:border-amber-500/30 or similar accent border
- [ ] motion.div with whileInView stagger animation

**Buttons:**
- [ ] whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
- [ ] transition-all duration-300
- [ ] For primary: bg-white text-black hover:bg-amber-400
- [ ] For secondary: bg-white/10 backdrop-blur-sm border border-white/20

**FORBIDDEN:**
- Static elements without any motion
- Buttons without hover/active states
- Images without scale/zoom on hover
- Cards without border/shadow transitions
```

---

### Phase 3: Add Navigation.tsx Template

**File:** `supabase/functions/vibecoder-builder/index.ts`

Add a new template to `FILE_TEMPLATES` for Navigation.tsx:

```typescript
'components/Navigation.tsx': `
### NAVIGATION COMPONENT TEMPLATE (components/Navigation.tsx)
Sticky glassmorphism nav with logo and smooth scroll links.

\`\`\`tsx
import React from 'react';
import { motion } from 'framer-motion';

interface NavigationProps {
  brandName: string;
  links?: { label: string; href: string }[];
}

export function Navigation({ brandName, links = [] }: NavigationProps) {
  const defaultLinks = links.length > 0 ? links : [
    { label: 'Collection', href: '#products' },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-2xl border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="#" className="text-xl font-serif text-white tracking-tight">
          {brandName}
        </a>
        <div className="hidden md:flex items-center gap-8">
          {defaultLinks.map((link) => (
            <a 
              key={link.href}
              href={link.href}
              className="text-sm text-zinc-400 hover:text-white transition-colors duration-300 relative group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-amber-400 group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </div>
      </div>
    </motion.nav>
  );
}
\`\`\``,
```

---

### Phase 4: Update Output Format

**File:** `supabase/functions/vibecoder-architect/index.ts`

Update the JSON output format to include Navigation.tsx in the files array:

```json
{
  "vibeAnalysis": { ... },
  "files": [
    { "path": "data/products.ts", "priority": 1 },
    { "path": "components/Navigation.tsx", "priority": 2 },
    { "path": "components/Hero.tsx", "priority": 3 },
    { "path": "components/ProductGrid.tsx", "priority": 4 },
    { "path": "App.tsx", "priority": 5 }
  ],
  "uniqueDesignFeature": {
    "element": "REQUIRED - must describe signature visual",
    "implementation": "REQUIRED - Tailwind classes or approach"
  },
  "executionOrder": [...],
  "complexityScore": 5
}
```

---

## Technical Changes Summary

| File | Change | Purpose |
|------|--------|---------|
| `vibecoder-architect/index.ts` | Add "MINIMUM QUALITY REQUIREMENTS" | Enforce 4+ complexity, unique feature |
| `vibecoder-architect/index.ts` | Add Navigation.tsx to file manifest | Complete the site structure |
| `vibecoder-architect/index.ts` | Add Typography Mandate | Force professional font pairings |
| `vibecoder-builder/index.ts` | Add Navigation.tsx template | Provide the nav pattern |
| `vibecoder-builder/index.ts` | Add "MICRO-INTERACTION CHECKLIST" | Enforce polish on every element |

---

## Expected Outcomes

1. **Every site has a sticky nav** — No more floating content with no structure
2. **Unique signature feature** — Each storefront has a differentiating element
3. **Minimum complexity 4+** — Rejects "PDF-style" low-density plans
4. **Typography enforcement** — Professional font pairings are mandatory
5. **Micro-interactions everywhere** — Every element has hover/motion states

---

## Code Injection Blocks

### Architect: Minimum Quality Requirements
```text
### MINIMUM QUALITY REQUIREMENTS (REJECT IF NOT MET)

Every blueprint MUST achieve complexity score 4+ (out of 5).

**MANDATORY FILES (5-6):**
1. data/products.ts
2. components/Navigation.tsx (sticky glassmorphism)
3. components/Hero.tsx (3+ gradient layers)
4. components/ProductGrid.tsx (asymmetric editorial)
5. App.tsx (max 40 lines)

**UNIQUE DESIGN FEATURE (MANDATORY):**
Every plan MUST include "uniqueDesignFeature" with:
- element: Signature visual feature
- implementation: Tailwind approach
```

### Builder: Micro-Interaction Checklist
```text
### MICRO-INTERACTION CHECKLIST

Hero:
- motion.h1 with opacity/y animation
- 3+ gradient background layers
- CTA with whileHover scale

Cards:
- group class + overflow-hidden
- group-hover:scale-110 on images
- hover:border accent change
- motion.div whileInView stagger

Buttons:
- whileHover + whileTap scale
- transition-all duration-300
```

### New Navigation Template
```tsx
<motion.nav className="fixed top-0 z-50 bg-black/40 backdrop-blur-2xl border-b border-white/10">
  {/* Logo + Links with hover underline animation */}
</motion.nav>
```
