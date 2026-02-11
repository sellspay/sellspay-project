

# Tools Platform Overhaul: Database Foundation + 3-Tab UI Redesign

## Overview

Transform the Tools page from a simple sidebar-based tool launcher into a real platform with three distinct surfaces (Quick Tools, Campaign Builder, Store Assistant), backed by a unified job pipeline, assets library, brand kit, and tools registry.

## Phase 1: Database Schema (New Tables)

### 1. `tools_registry` -- Central tool catalog
Defines every tool as a module with typed inputs/outputs and pricing.

| Column | Type | Notes |
|--------|------|-------|
| id | text (PK) | e.g. `sfx-generator`, `product-description` |
| name | text | Display name |
| category | text | `quick_tool`, `campaign`, `store_assistant` |
| subcategory | text | `store_growth`, `social_content`, `media_creation`, `utility` |
| icon_name | text | Lucide icon name |
| description | text | Short description |
| inputs_schema | jsonb | JSON Schema for tool inputs |
| outputs_schema | jsonb | JSON Schema for tool outputs |
| credit_cost | integer | Base credit cost per run |
| execution_type | text | `provider_api`, `cpu_local`, `gpu_local` |
| max_duration_seconds | integer | NULL = no limit |
| safety_profile | text | `strict`, `normal`, `off` |
| is_pro | boolean | Requires subscription |
| is_active | boolean | Enabled/disabled |
| sort_order | integer | Display ordering |
| created_at | timestamptz | |

### 2. `tool_jobs` -- Unified job pipeline
Every tool execution becomes a tracked job with status lifecycle.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid | Owner |
| tool_id | text | FK to tools_registry |
| status | text | `queued`, `processing`, `completed`, `failed`, `cancelled` |
| inputs | jsonb | Snapshot of user inputs (prompt, settings, etc.) |
| product_context | jsonb | NULL or snapshot of product data if "Use Product" was selected |
| brand_kit_snapshot | jsonb | NULL or snapshot of brand kit at time of run |
| credit_cost | integer | Reserved credits |
| credit_refunded | boolean | True if auto-refunded on failure |
| error_message | text | NULL unless failed |
| started_at | timestamptz | |
| completed_at | timestamptz | |
| created_at | timestamptz | |

### 3. `tool_assets` -- Every output is a reusable asset
Generated outputs linked to jobs, products, and storefronts.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid | Owner |
| job_id | uuid | FK to tool_jobs |
| type | text | `image`, `video`, `audio`, `text`, `file` |
| storage_url | text | URL in storage bucket |
| thumbnail_url | text | Auto-generated thumbnail |
| filename | text | Original/generated filename |
| file_size_bytes | integer | |
| duration_seconds | numeric | For audio/video |
| metadata | jsonb | Prompt, model, seed, aspect ratio, language, etc. |
| product_id | uuid | NULL or linked product |
| used_on_page | text | NULL or `hero`, `gallery`, `thumbnail` |
| safety_flags | jsonb | `{nsfw: false, copyrighted: false}` |
| is_favorite | boolean | User-starred |
| created_at | timestamptz | |

### 4. `brand_kits` -- Per-seller brand identity
Extends existing `storefront_brand_profiles` with tool-specific fields.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid | Owner (unique per user) |
| logo_url | text | Primary logo |
| logo_dark_url | text | Dark mode logo |
| color_palette | jsonb | Array of hex colors |
| fonts | jsonb | `{heading: "Inter", body: "System"}` |
| brand_voice | text | Tone description/examples |
| banned_words | text[] | Compliance/brand words to avoid |
| target_audience | text | Niche/audience description |
| product_categories | text[] | Types of products they sell |
| sample_prompts | jsonb | Example prompt/output pairs for voice calibration |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### 5. `campaign_templates` -- Multi-step workflow definitions
Pre-built campaign workflows users can run.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| name | text | e.g. "Product Launch Pack" |
| description | text | |
| steps | jsonb | Array of `{tool_id, label, auto_inputs}` |
| category | text | `product_launch`, `social_pack`, `promo_video` |
| estimated_credits | integer | Total cost estimate |
| is_active | boolean | |
| sort_order | integer | |
| created_at | timestamptz | |

### Storage
- Create a new `tool-assets` storage bucket (public) for generated outputs

### RLS Policies
- All new tables: users can only read/write their own rows (`user_id = auth.uid()`)
- `tools_registry` and `campaign_templates`: public read, admin-only write
- `tool-assets` bucket: authenticated users can upload/read their own files

### Realtime
- Enable realtime on `tool_jobs` so the UI can show live status updates during processing

## Phase 2: Tools Page UI Redesign

### New Layout: 3-Tab Architecture

Replace the current sidebar + detail view with a full-page tabbed interface.

```text
+--------------------------------------------------+
|  AI Studio                        [Credits: 450]  |
|--------------------------------------------------|
|  [Quick Tools]  [Campaigns]  [Store Assistant]    |
|--------------------------------------------------|
|                                                   |
|   (Tab content below)                             |
|                                                   |
+--------------------------------------------------+
```

### Tab 1: Quick Tools (Single-shot generators)
Grid of tool cards organized by subcategory:

- **Store Growth**: Product description generator, Thumbnail generator, Sales page sections, Upsell/bundle suggestions
- **Social Content**: "10 posts from product", Short-form script generator, Caption + hashtags pack, Carousel generator
- **Media Creation**: SFX Generator, Voice Isolator, SFX Isolator, Music Splitter, TTS Voiceover
- **Creator Utility**: Background remover, Upscaler, Audio cleanup, Subtitle generator, Audio Cutter, Audio Joiner, Audio Converter, Audio Recorder, Video to Audio, Waveform Generator

Each card shows: icon, name, credit cost badge (or "Free"), short description, "Launch" button.

### Tab 2: Campaigns (Multi-step workflows)
Shows pre-built campaign templates as large cards:

- **Product Launch Pack**: Extract benefits -> Generate hooks -> Scripts -> Voiceover -> Captions -> Export
- **Social Content Pack**: Pick product -> Generate 10 posts -> Carousel images -> Caption pack
- **Promo Video Builder**: Product images + captions + voiceover + transitions

Each campaign card shows: step count, estimated credits, products required, "Start Campaign" button.
(Campaign execution is a future feature; this tab shows the templates and a "Coming Soon" state for the actual runner.)

### Tab 3: Store Assistant (Storefront-modifying tools)
Tools that directly update the seller's storefront:

- Generate hero section
- Rewrite copy in brand voice
- Create FAQ from product
- Generate SEO landing page
- Generate bundles/upsells

Each shows a description and "Run" button. These connect to the existing storefront vibecoder system.

### Shared UI Elements
- **Source Selector**: Toggle at top of every generator between "Blank" and "Use Product" (opens product picker)
- **Brand Kit Toggle**: Checkbox "Use my Brand Kit" that injects brand context into prompts
- **Credit Estimator**: Shows cost before running
- **Asset Output Panel**: After generation, shows quick actions: "Set as product thumbnail", "Add to gallery", "Download", "Generate more"

### My Assets (Sub-section)
Accessible from a "My Assets" button in the header area. Shows a filterable grid of all generated assets with:
- Type filter (image/audio/video/text)
- Tool filter
- Product link filter
- Favorite/star toggle
- Bulk download

## Phase 3: Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| Migration SQL | Create | All 5 new tables + storage bucket + RLS + realtime |
| `src/pages/Tools.tsx` | Rewrite | 3-tab layout with Quick Tools / Campaigns / Store Assistant |
| `src/components/tools/QuickToolsGrid.tsx` | New | Categorized grid of single-shot tool cards |
| `src/components/tools/CampaignsGrid.tsx` | New | Campaign template cards with step previews |
| `src/components/tools/StoreAssistantGrid.tsx` | New | Storefront-modifying tool cards |
| `src/components/tools/ToolCard.tsx` | New | Reusable tool card component with icon, cost, launch button |
| `src/components/tools/SourceSelector.tsx` | New | "Blank" / "Use Product" toggle + product picker |
| `src/components/tools/BrandKitToggle.tsx` | New | Checkbox that injects brand context |
| `src/components/tools/AssetOutputPanel.tsx` | New | Post-generation quick actions panel |
| `src/components/tools/MyAssetsDrawer.tsx` | New | Filterable assets library drawer/modal |
| `src/components/tools/CreditEstimator.tsx` | New | Pre-run cost display |
| `src/components/tools/toolsRegistry.ts` | New | Client-side tool definitions matching tools_registry table |
| `src/components/tools/ToolShowcase.tsx` | Keep | Still used for detail view when launching a tool |
| `src/components/tools/ToolActiveView.tsx` | Keep | Still used for running tools |
| `src/components/tools/toolsData.ts` | Extend | Add new tool entries for store growth, social, utility tools |

## What This Does NOT Include (Future Phases)

- Actual AI implementation for new tools (product description generator, etc.) -- just the UI cards with "Coming Soon" for tools that don't have a backend yet
- Campaign execution engine (the runner that chains tool_jobs) -- templates are shown but execution is v1.5
- GPU worker infrastructure -- all tools continue using provider APIs
- Abuse/moderation system -- noted in schema via `safety_flags` but no enforcement layer yet
- Analytics dashboard widget ("Content created this week") -- future addition

