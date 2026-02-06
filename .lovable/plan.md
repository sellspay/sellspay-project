
# SellsPay VibeCoder 2.0+ & Platform Pulse - God-Tier Upgrade Blueprint

## Executive Summary

This plan consolidates the Multi-Agent Engine enhancements, Self-Healing improvements, Premium Changelog UI, and Discord Automation into a cohesive implementation roadmap.

---

## Current State Analysis

### What's Already Implemented (VibeCoder 2.1)

| Component | Status | Implementation |
|-----------|--------|----------------|
| **3-Agent Pipeline** | ✅ Complete | Architect (Gemini 3 Pro) → Builder (Gemini 3 Flash) → Linter (Gemini 2.5 Flash Lite) |
| **Shadow Render** | ✅ Complete | esbuild WASM transpilation check in `vibecoder-orchestrator` |
| **Self-Healing Loop** | ✅ Complete | Max 3 retries with full `failedCode` + `fixSuggestion` context |
| **Dedicated Heal Endpoint** | ✅ Complete | `vibecoder-heal` for runtime error surgery |
| **Frontend Error Wiring** | ✅ Complete | `FixErrorToast` → `healCode()` in `useAgentLoop.ts` |
| **Tiered Credits** | ✅ Complete | Complexity-based pricing (1/3/8/15 credits) |
| **Design Tokens** | ✅ Complete | 6 style profiles with Tailwind recipes in `vibecoder-builder` |
| **SDK Components** | ✅ Complete | 7 components in `vibecoder-stdlib.ts` (ProductCard, HeroSection, etc.) |
| **Style Profiles** | ✅ Complete | 6 profiles in `vibecoder-style-profiles.ts` |

### Missing or Needs Enhancement

| Gap | Current State | Blueprint Requirement |
|-----|--------------|----------------------|
| **Changelog UI** | Basic `platform_updates` table exists | Premium Timeline with version tags, media, Discord sync |
| **SemVer System** | No versioning | Major.Minor.Patch with automatic tagging |
| **Discord Webhook** | Not implemented | Auto-post on changelog publish |
| **SDK Folder** | Components in stdlib (strings) | Real `src/components/sellspay/` folder for discoverability |
| **Architect uniqueDesignFeature** | Not in current schema | Add to prevent design repetition |
| **Healing Stats Logging** | Not tracked | Log successful heals for "AI is squashing bugs" display |

---

## Implementation Plan

### PART 1: Enhanced Multi-Agent Orchestration

#### 1A. Add `uniqueDesignFeature` to Architect Output

The Architect should output a mandatory "signature element" per build to prevent repetition.

**File**: `supabase/functions/vibecoder-architect/index.ts`

**Changes**:
- Update JSON schema to include `uniqueDesignFeature`:
```json
"uniqueDesignFeature": {
  "element": "Animated gradient border on hero",
  "implementation": "bg-gradient-to-r from-cyan-500 via-transparent to-pink-500 animate-gradient"
}
```
- Add to system prompt: "Every design MUST include one unique visual signature that distinguishes it from other stores"

#### 1B. Builder Model Alignment

The blueprint mentions Claude 3.5 Sonnet as an option, but current implementation uses Gemini 3 Flash.

**Decision Required**: Stay with Gemini 3 Flash (current, fast) or add Claude as a fallback for complex builds?

**Recommendation**: Keep Gemini 3 Flash as default - it's integrated with Lovable AI gateway. Adding Claude would require API key management.

#### 1C. Linter Ghost Render Enhancement

The Shadow Render in the orchestrator uses esbuild which catches syntax errors. For true React runtime validation (hooks in loops, etc.), we'd need JSDOM + React - too heavy for edge functions.

**Current Limitation**: esbuild catches ~80% of crashes. True runtime errors still go through frontend `handlePreviewError` → `healCode()`.

**Recommendation**: Keep current architecture - the frontend healing path handles what esbuild misses.

---

### PART 2: SellsPay Pulse (Changelog & Version UI)

#### 2A. Database Schema Enhancement

Add versioning fields to `platform_updates` table:

```sql
ALTER TABLE platform_updates
ADD COLUMN version_number text,
ADD COLUMN version_type text CHECK (version_type IN ('major', 'minor', 'patch')),
ADD COLUMN media_url text,
ADD COLUMN media_type text CHECK (media_type IN ('image', 'gif', 'video')),
ADD COLUMN discord_sent boolean DEFAULT false,
ADD COLUMN feature_tags text[];
```

#### 2B. Changelog Page Component

**New File**: `src/pages/Changelog.tsx`

**Visual Design**:
- Vertical spine timeline with year/month groupings
- Sticky version tags that pin on scroll
- Pill tags: `[Added]` (green), `[Improved]` (blue), `[Fixed]` (amber), `[Marketplace]` (purple)
- Media cards with image/GIF preview
- Mobile-responsive layout

```text
┌────────────────────────────────────────────────────────────────┐
│  SELLSPAY CHANGELOG                                            │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  February 2026                                                 │
│  ════════════                                                  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ v2.1.0                                           [Added] │  │
│  │                                                          │  │
│  │ Multi-Agent Self-Healing Pipeline                        │  │
│  │ VibeCoder now fixes its own bugs with a 3-agent loop.   │  │
│  │                                                          │  │
│  │ ┌────────────────────────────────────────────────────┐  │  │
│  │ │  [Screenshot/GIF of self-healing in action]       │  │  │
│  │ └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  January 2026                                                  │
│  ═══════════                                                   │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ v2.0.0                                           [Major] │  │
│  │                                                          │  │
│  │ VibeCoder 2.0 Launch                                     │  │
│  │ Complete rewrite with Architect → Builder → Linter.      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

#### 2C. Changelog Slide-Over Panel (In-App)

**New File**: `src/components/ai-builder/ChangelogPanel.tsx`

- Accessible from VibeCoder header ("What's New" button)
- Sheet/drawer component that slides in from right
- Shows last 5 updates with quick dismiss

#### 2D. Versioning Logic (SemVer)

**New File**: `src/lib/versioning.ts`

```typescript
interface Version {
  major: number;
  minor: number;
  patch: number;
}

function incrementVersion(current: Version, type: 'major' | 'minor' | 'patch'): Version;
function formatVersion(v: Version): string; // "2.1.0"
function getLatestVersion(): Promise<Version>; // From DB
```

---

### PART 3: Discord Webhook Automation

#### 3A. New Edge Function

**New File**: `supabase/functions/notify-changelog/index.ts`

**Trigger**: Called after inserting into `platform_updates` with `version_number` set.

**Payload Structure**:
```typescript
const discordPayload = {
  embeds: [{
    title: `🚀 SellsPay Evolution: v${versionNumber}`,
    description: updateSummary,
    color: 0xEE0000, // SellsPay Brand Red
    fields: [
      { name: "✨ Highlight", value: topFeature, inline: true },
      { name: "📋 Category", value: category, inline: true }
    ],
    image: { url: mediaUrl },
    footer: { text: "Powered by VibeCoder 2.0 Agent Pipeline" },
    timestamp: new Date().toISOString()
  }]
};
```

#### 3B. Secret Configuration

**Required Secret**: `DISCORD_CHANGELOG_WEBHOOK_URL`

This needs to be added via the Lovable secrets manager before the function will work.

#### 3C. Database Trigger Option

For automatic Discord posts, create a Postgres trigger:

```sql
CREATE OR REPLACE FUNCTION notify_discord_on_changelog()
RETURNS TRIGGER AS $$
BEGIN
  -- Only fire when version_number is set and discord_sent is false
  IF NEW.version_number IS NOT NULL AND NOT COALESCE(NEW.discord_sent, false) THEN
    PERFORM net.http_post(
      url := current_setting('app.discord_webhook_url'),
      body := json_build_object(...)::text
    );
    NEW.discord_sent := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Alternative**: Manual trigger via admin dashboard button (simpler, more control).

---

### PART 4: Elite Style Engine Improvements

#### 4A. Physical SDK Components Folder

Currently, SDK components exist as strings in `vibecoder-stdlib.ts`. For better discoverability and import clarity, create actual files:

**New Files**:
- `src/components/sellspay/index.ts` (barrel export)
- `src/components/sellspay/ProductCard.tsx`
- `src/components/sellspay/CheckoutButton.tsx`
- `src/components/sellspay/HeroSection.tsx`
- `src/components/sellspay/FeaturedProducts.tsx`
- `src/components/sellspay/CreatorBio.tsx`
- `src/components/sellspay/StickyNav.tsx`
- `src/components/sellspay/TestimonialCard.tsx`
- `src/components/sellspay/StatsBar.tsx`

These mirror the stdlib versions but exist in the actual codebase for:
1. Type checking in the editor
2. AI discoverability when searching the codebase
3. Potential reuse in non-Sandpack contexts

#### 4B. Healing Stats Logger

Track successful self-corrections for a future "VibeCoder Stats" dashboard.

**New Table**: `vibecoder_heal_logs`

```sql
CREATE TABLE vibecoder_heal_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES vibecoder_projects(id),
  user_id uuid REFERENCES auth.users(id),
  error_type text NOT NULL,
  error_message text,
  healing_source text CHECK (healing_source IN ('orchestrator', 'frontend')),
  success boolean DEFAULT false,
  attempts integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);
```

**Usage**: Insert from `vibecoder-heal` and `vibecoder-orchestrator` on successful fixes.

**Display**: Future "AI is squashing bugs" real-time counter on changelog/landing page.

---

## Implementation Order

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| 1 | Database migration: Changelog version fields | Low | Medium |
| 2 | Changelog page UI (`/changelog`) | Medium | High |
| 3 | Changelog slide-over in AI Builder | Low | Medium |
| 4 | Discord webhook edge function | Low | High |
| 5 | Physical SDK folder (parallel to stdlib) | Medium | Low |
| 6 | Architect `uniqueDesignFeature` | Low | Medium |
| 7 | Healing stats logger | Low | Low |

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/XXXX_changelog_versioning.sql` | CREATE | Add version fields to platform_updates |
| `src/pages/Changelog.tsx` | CREATE | Premium changelog page |
| `src/components/ai-builder/ChangelogPanel.tsx` | CREATE | In-app changelog drawer |
| `src/components/changelog/ChangelogTimeline.tsx` | CREATE | Reusable timeline component |
| `src/components/changelog/ChangelogEntry.tsx` | CREATE | Single update card |
| `src/lib/versioning.ts` | CREATE | SemVer helpers |
| `supabase/functions/notify-changelog/index.ts` | CREATE | Discord webhook |
| `src/components/sellspay/*.tsx` | CREATE | Physical SDK components |
| `supabase/functions/vibecoder-architect/index.ts` | MODIFY | Add uniqueDesignFeature |
| `supabase/functions/vibecoder-heal/index.ts` | MODIFY | Log healing stats |

---

## Technical Notes

### Discord Webhook Security

The webhook URL is a secret that shouldn't be exposed to the frontend. The edge function approach ensures the URL stays server-side.

### Changelog RLS Policy

```sql
-- Public read for all published updates
CREATE POLICY "Public can read published updates"
ON platform_updates FOR SELECT
TO public
USING (true);

-- Only admins can insert/update
CREATE POLICY "Admins can manage updates"
ON platform_updates FOR ALL
TO authenticated
USING (auth.uid() IN (SELECT user_id FROM admin_users));
```

### Healing Stats Privacy

The `vibecoder_heal_logs` table should have RLS that only allows:
- Users to see their own project's heal stats
- Admins to see aggregate anonymous stats

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| First-attempt success rate | ~70% | 85%+ |
| Average healing attempts | 1.5 | 1.2 |
| Discord engagement (post views) | N/A | 100+ per update |
| Changelog page visits | N/A | Track |
| Unique design features | Repetitive | Distinct per build |
