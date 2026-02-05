
# AI Storefront Vibecoder Implementation Plan

## Overview

This plan implements a chat-based AI co-pilot called "AI Builder" for the creator storefront editor. The system allows creators to describe changes in natural language, receive validated patch operations, preview changes before applying, and generate branded assets—all while respecting a structurally locked profile header.

---

## Architecture Summary

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PROFILE EDITOR DIALOG                              │
├───────────────┬─────────────────────────────────┬───────────────────────────┤
│               │                                 │                           │
│  LOCKED SHELL │     EDITABLE CANVAS             │   AI BUILDER SIDEBAR      │
│  (Header)     │     (Sections)                  │                           │
│               │                                 │   ┌───────────────────┐   │
│  - Banner     │   ┌─────────────────────────┐   │   │ Chat Messages     │   │
│  - Avatar     │   │ Section 1               │   │   │                   │   │
│  - Name       │   └─────────────────────────┘   │   │ User: Make it...  │   │
│  - Bio        │   ┌─────────────────────────┐   │   │ AI: I'll update...│   │
│  - Links      │   │ Section 2               │   │   │ [Apply] [Redo]    │   │
│               │   └─────────────────────────┘   │   └───────────────────┘   │
│  "Edit in     │   ┌─────────────────────────┐   │   ┌───────────────────┐   │
│   Settings"   │   │ Section N               │   │   │ Quick Actions     │   │
│               │   └─────────────────────────┘   │   │ [Premium] [Hero]  │   │
│               │                                 │   └───────────────────┘   │
│               │                                 │   ┌───────────────────┐   │
│               │                                 │   │ Input: Describe...│   │
│               │                                 │   └───────────────────┘   │
└───────────────┴─────────────────────────────────┴───────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │      ASSET DRAFT TRAY         │
                    │ [Banner 1] [Banner 2] [+Gen]  │
                    └───────────────────────────────┘
```

---

## Phase 1: Database Schema

### New Tables

**1. `storefront_brand_profiles`** — Stores the creator's brand identity for AI context

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| profile_id | UUID | FK to profiles |
| color_palette | JSONB | Array of hex colors |
| vibe_tags | TEXT[] | e.g., ['minimal', 'dark', 'premium'] |
| font_preference | TEXT | Primary font choice |
| reference_images | JSONB | Array of image URLs |
| created_at | TIMESTAMPTZ | Auto-generated |
| updated_at | TIMESTAMPTZ | Auto-updated |

**2. `storefront_generated_assets`** — Draft tray for AI-generated images

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| profile_id | UUID | FK to profiles |
| asset_url | TEXT | Base64 or storage URL |
| asset_type | TEXT | 'banner', 'thumbnail', 'background', 'promo' |
| prompt | TEXT | Generation prompt |
| spec | JSONB | Full asset request spec |
| status | TEXT | 'draft', 'applied', 'discarded' |
| created_at | TIMESTAMPTZ | Auto-generated |

**3. `storefront_ai_conversations`** — Chat history for context

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| profile_id | UUID | FK to profiles |
| role | TEXT | 'user' or 'assistant' |
| content | TEXT | Message text |
| operations | JSONB | Patch ops (for assistant messages) |
| asset_requests | JSONB | Asset generation requests |
| created_at | TIMESTAMPTZ | Auto-generated |

**4. `storefront_ai_usage`** — Credit tracking for AI operations

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| profile_id | UUID | FK to profiles |
| action_type | TEXT | 'text_layout', 'image_gen', 'video_gen' |
| credits_used | INTEGER | Credits consumed |
| created_at | TIMESTAMPTZ | Auto-generated |

### RLS Policies

- Users can only read/write their own brand profiles, assets, conversations, and usage
- All tables have `profile_id = auth.uid()` policies

---

## Phase 2: Type Definitions

### New Types in `src/components/profile-editor/vibecoder/types.ts`

```typescript
// === PATCH OPERATIONS ===

export type VibecoderOp =
  | AddSectionOp
  | RemoveSectionOp
  | MoveSectionOp
  | UpdateSectionOp
  | UpdateThemeOp
  | UpdateHeaderContentOp
  | AssignAssetToSlotOp;

export interface AddSectionOp {
  op: 'addSection';
  after: string | null; // section ID or null for top
  section: Partial<ProfileSection>;
}

export interface RemoveSectionOp {
  op: 'removeSection';
  sectionId: string;
}

export interface MoveSectionOp {
  op: 'moveSection';
  sectionId: string;
  after: string | null;
}

export interface UpdateSectionOp {
  op: 'updateSection';
  sectionId: string;
  patch: Record<string, unknown>;
}

export interface UpdateThemeOp {
  op: 'updateTheme';
  path: string;
  value: unknown;
}

export interface UpdateHeaderContentOp {
  op: 'updateHeaderContent';
  patch: {
    bannerAssetId?: string | null;
    avatarAssetId?: string | null;
    displayName?: string;
    bio?: string;
    links?: { label: string; url: string }[];
  };
}

export interface AssignAssetToSlotOp {
  op: 'assignAssetToSlot';
  slot: 'header.banner' | 'header.avatar' | 'section.image' | 'section.bg' | 'product.thumbnail';
  assetId: string;
  targetId: string;
}

// === ASSET REQUESTS ===

export interface AssetRequest {
  kind: 'image' | 'icon_set' | 'video_loop';
  count: number; // 1-8
  spec: {
    purpose: string;
    style: string;
    palette?: string[];
    aspect?: string;
    negative?: string;
  };
}

// === AI RESPONSE ===

export interface VibecoderResponse {
  message: string;
  ops: VibecoderOp[];
  asset_requests?: AssetRequest[];
  preview_notes?: string[];
}

// === BRAND PROFILE ===

export interface BrandProfile {
  id: string;
  colorPalette: string[];
  vibeTags: string[];
  fontPreference: string;
  referenceImages: string[];
}

// === GENERATED ASSET ===

export interface GeneratedAsset {
  id: string;
  url: string;
  type: 'banner' | 'thumbnail' | 'background' | 'promo';
  prompt: string;
  status: 'draft' | 'applied' | 'discarded';
}
```

---

## Phase 3: Edge Functions

### 3.1 `storefront-vibecoder` — Main AI Chat Function

**Path:** `supabase/functions/storefront-vibecoder/index.ts`

**System Prompt (embedded in function):**

```
You are SellsPay's Storefront Vibecoder: a chat-based co-pilot that edits a creator's storefront safely.

GOAL
Help users improve their storefront design, layout, copy, and assets while preserving platform constraints and keeping edits reversible and previewable.

HARD CONSTRAINTS (NON-NEGOTIABLE)
1) The Profile Shell is LOCKED structurally:
   - Banner area + avatar + profile header layout must never be removed, reordered, or structurally changed.
   - You may propose content changes to banner image, avatar image, display name, bio, and social links ONLY via allowed header ops.
2) You must edit the storefront using patch operations only.
   - Never output raw HTML/CSS/JS as the main result.
   - Never output full layout replacements.
3) Safety:
   - Never inject scripts, iframes, event handlers, tracking pixels, or arbitrary code.
   - Never modify billing, payout, auth, admin roles, or account/security settings.
   - Never access private user data beyond what is provided in context.
4) Only use section types supported by the product's section registry.
5) Every response must be apply-able as a PATCH: return JSON with `ops[]` matching the tool schema.

WORKING STYLE
- Ask at most ONE clarifying question only when required to avoid making wrong changes.
- Otherwise: make the best possible assumption and proceed.
- Provide 2–3 options if the user asks for a vibe/aesthetic.
- Prefer minimal, premium changes that preserve template integrity.
- Always keep changes reversible and summarize them.

INPUT CONTEXT YOU RECEIVE
- StorefrontLayout JSON
- SupportedSections registry (types + allowed fields)
- Product & collection metadata (names, tags, thumbnails, prices)
- BrandProfile (palette, fonts, vibe tags, references)
- User selection (optional): which section the user is focused on

OUTPUT FORMAT (STRICT)
Return only valid JSON via tool call to "apply_storefront_changes".

QUALITY BAR
Edits should look cohesive, aligned, spaced well, readable, and consistent with the brand. Avoid clutter.
```

**Implementation Details:**
- Uses Lovable AI Gateway (`google/gemini-3-flash-preview`)
- Tool calling for structured output
- Validates operations before returning
- Handles rate limits (429) and credit errors (402)

### 3.2 `storefront-generate-asset` — Asset Generation

**Path:** `supabase/functions/storefront-generate-asset/index.ts`

- Uses `google/gemini-2.5-flash-image` for generation
- Stores result in `storefront_generated_assets` with status='draft'
- Applies brand profile colors/style to prompts

---

## Phase 4: Patch Validation Layer

### Server-Side Validation Rules

**File:** Embedded in edge function + client-side hook

**A) Structural Rules**
- Reject any op that targets header structure (only `updateHeaderContent` or `assignAssetToSlot` for header allowed)
- Reject unknown section types (must exist in `SECTION_TEMPLATES`)
- Reject section patches with unknown fields (strict allowlist per type)

**B) Content Safety Rules**
- Strip/deny: `<script>`, `javascript:`, `data:text/html`, inline event handlers
- Sanitize URLs (http/https only, max 2000 chars)
- Max lengths: displayName ≤ 40, bio ≤ 160, headlines ≤ 80, paragraphs ≤ 800
- Asset IDs must exist and be owned by user

**C) UX Stability Rules**
- Enforce max 25 sections
- `moveSection` cannot create duplicates or invalid ordering

**D) Reversibility**
- Every op is invertible:
  - `addSection` → `removeSection` with same ID
  - `updateSection` → store previous values in history
- Apply ops in transaction; rollback if any op fails

---

## Phase 5: UI Components

### 5.1 Updated Editor Sidebar Tabs

**File:** `src/components/profile-editor/EditorSidebar.tsx`

Add new tabs:
```typescript
const tabs = [
  { id: 'sections', label: 'Sections', icon: Layers },
  { id: 'vibecoder', label: 'AI Builder', icon: Sparkles }, // NEW
  { id: 'brand', label: 'Brand', icon: Palette },           // NEW
  { id: 'style', label: 'Store Style', icon: Settings },
];
```

### 5.2 Vibecoder Chat Panel

**File:** `src/components/profile-editor/vibecoder/VibecoderChat.tsx`

**UI Elements:**
- Title: "AI Builder"
- Chat message history (scrollable)
- Quick action chips:
  - "Make it look premium"
  - "Rewrite my bio"
  - "Add a hero section"
  - "Add a bento grid"
  - "Improve spacing"
  - "Generate a banner"
  - "Generate matching thumbnails"
- Input placeholder: "Describe what you want to change… e.g. 'Make this storefront more premium and add a featured section.'"
- Send button

**AI Response Template:**
```
Proposed changes
• Updated theme accent + typography scale
• Added "Featured Products" section under Hero
• Rewrote headline + CTA copy

[Preview changes] [Apply] [Undo] [Regenerate]
```

### 5.3 Asset Draft Tray

**File:** `src/components/profile-editor/vibecoder/AssetDraftTray.tsx`

**UI:**
- Horizontal scrollable tray at bottom of editor
- Title: "Generated Assets (Drafts)"
- Subtitle: "Select an asset to apply. Nothing changes until you apply."
- Per-asset buttons:
  - "Use as banner"
  - "Use in selected section"
  - "Regenerate like this"
  - "Discard"
- "+ Generate" button

### 5.4 Brand Profile Panel

**File:** `src/components/profile-editor/vibecoder/BrandProfilePanel.tsx`

**UI:**
- Color palette picker (add/remove colors)
- Vibe tags (chips, add custom)
- Font preference dropdown
- Reference images upload

### 5.5 Operation Preview Dialog

**File:** `src/components/profile-editor/vibecoder/OperationPreview.tsx`

- Shows diff of what will change
- Highlights affected sections in preview
- "Apply" / "Cancel" buttons

---

## Phase 6: React Hooks

### 6.1 `useVibecoderChat`

**File:** `src/components/profile-editor/vibecoder/hooks/useVibecoderChat.ts`

```typescript
interface UseVibecoderChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (text: string) => Promise<void>;
  pendingOps: VibecoderOp[] | null;
  applyPendingOps: () => void;
  discardPendingOps: () => void;
  regenerate: () => void;
}
```

### 6.2 `useVibecoderOperations`

**File:** `src/components/profile-editor/vibecoder/hooks/useVibecoderOperations.ts`

```typescript
interface UseVibecoderOperationsReturn {
  validateOperation: (op: VibecoderOp) => ValidationResult;
  applyOperations: (ops: VibecoderOp[]) => void;
  previewOperations: (ops: VibecoderOp[]) => ProfileSection[];
  getInverseOps: (ops: VibecoderOp[]) => VibecoderOp[];
}
```

### 6.3 `useBrandProfile`

**File:** `src/components/profile-editor/vibecoder/hooks/useBrandProfile.ts`

- CRUD for `storefront_brand_profiles`
- Auto-create on first access

### 6.4 `useGeneratedAssets`

**File:** `src/components/profile-editor/vibecoder/hooks/useGeneratedAssets.ts`

- List drafts for current profile
- Apply asset to slot
- Discard asset
- Trigger new generation

### 6.5 `useVibecoderCredits`

**File:** `src/components/profile-editor/vibecoder/hooks/useVibecoderCredits.ts`

- Check available credits
- Deduct credits on action
- Show cost before generating assets

---

## Phase 7: Credit System

### Pricing Structure

| Action Type | Credit Cost | Notes |
|-------------|-------------|-------|
| Text & Layout | 0 (included) | Copy rewrite, section add/move, theme tweaks |
| Banner Image | 3 credits | Wide, high-res |
| Thumbnail/Icon | 1 credit | Small image |
| Icon Set (6) | 4 credits | Batch generation |
| Video Loop | 10-25 credits | Based on duration |

### Pre-Generation Warning

Before any asset generation:
```
"This will cost X credits"
[Generate] [Cancel]
```

### Integration

Uses existing `useCredits` hook and `credit_transactions` table.

---

## Phase 8: Integration into ProfileEditorDialog

### State Additions

```typescript
// New state
const [activeTab, setActiveTab] = useState<'sections' | 'vibecoder' | 'brand' | 'style'>('sections');
const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>([]);
const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
const [pendingOps, setPendingOps] = useState<VibecoderOp[] | null>(null);
const [selectedSectionForAI, setSelectedSectionForAI] = useState<string | null>(null);
```

### Layout Changes

```
┌─────────────────────────────────────────────────────────────────┐
│ Header: Save | Undo | Redo | Close                              │
├───────────┬───────────────────────────────────┬─────────────────┤
│ Tab Icons │ Live Preview                      │ Right Panel     │
│ Sections  │ (Locked Header + Editable Canvas) │ (Based on Tab)  │
│ AI Builder│                                   │                 │
│ Brand     │                                   │                 │
│ Style     │                                   │                 │
├───────────┴───────────────────────────────────┴─────────────────┤
│ Asset Draft Tray (when assets exist)                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 9: Safety Microcopy

### Header Lock Tooltip

When hovering over the header in the preview:
```
Profile Header (Locked)
"You can change banner, avatar, name, bio, and links — layout stays fixed."
```

### Error Messages

```
"That change isn't supported yet. I can do X instead."
"I can't edit payouts or account settings. I can help redesign your storefront."
```

### Empty State

When AI Builder tab is first opened:
```
✨ AI Builder

I can help you:
• Redesign your storefront layout
• Rewrite copy to sound more premium
• Generate matching banners and thumbnails
• Add new sections like hero, FAQ, testimonials

[Make it look premium] [Add a hero section] [Generate a banner]

Type a request below to get started...
```

---

## File Structure

```
src/components/profile-editor/
├── vibecoder/
│   ├── VibecoderChat.tsx          # Main chat panel
│   ├── VibecoderMessage.tsx       # Individual message component
│   ├── AssetDraftTray.tsx         # Generated assets tray
│   ├── BrandProfilePanel.tsx      # Brand configuration
│   ├── OperationPreview.tsx       # Preview pending changes
│   ├── QuickActionChips.tsx       # Preset prompts
│   ├── CostWarningDialog.tsx      # Credit cost confirmation
│   ├── types.ts                   # Vibecoder types
│   └── hooks/
│       ├── useVibecoderChat.ts
│       ├── useVibecoderOperations.ts
│       ├── useBrandProfile.ts
│       ├── useGeneratedAssets.ts
│       └── useVibecoderCredits.ts
└── [existing files unchanged]

supabase/functions/
├── storefront-vibecoder/
│   └── index.ts                   # Main AI chat function
└── storefront-generate-asset/
    └── index.ts                   # Asset generation function
```

---

## Implementation Order

1. **Database**: Create tables with RLS policies
2. **Types**: Add TypeScript definitions
3. **Edge Functions**: Implement vibecoder + asset generation
4. **Hooks**: Build state management hooks
5. **UI Components**: VibecoderChat, BrandProfilePanel, AssetDraftTray
6. **Integration**: Wire into ProfileEditorDialog
7. **Testing**: End-to-end flow validation

---

## Summary

This implementation adds a Lovable-style AI Vibecoder to the existing profile editor that:

- **Respects the locked header shell** — AI can suggest content changes but never restructure
- **Uses patch operations only** — Safe, validated, reversible changes
- **Integrates asset generation** — Branded banners/thumbnails with draft tray workflow
- **Maintains brand consistency** — Brand profile provides AI context
- **Leverages existing infrastructure** — Uses existing history/undo, credits, and section types
- **Provides premium UX** — Clear microcopy, preview before apply, quick actions

The result feels like talking to a designer who understands the brand, edits in real-time, and never breaks the layout.
