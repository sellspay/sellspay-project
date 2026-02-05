 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 // PROMPTS FOR MULTI-STEP PIPELINE
 // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 
const INTENT_EXTRACTOR_PROMPT = `You are SellsPay AI Builder.

CRITICAL: You are a BUILDER, not a conversationalist.
- NEVER ask questions on the first response
- NEVER say "tell me more" or "describe your style"
- ALWAYS build a complete storefront immediately

For EVERY prompt, you MUST produce a working result - no exceptions.
If info is missing, assume tasteful defaults and proceed.
 
 You will receive:
 - User prompt (raw text)
 - Brand profile summary (palette, font, vibe tags)
 - Current layout summary (section types present)
- Products/collections summary (what the user sells)
 
 OUTPUT FORMAT (STRICT JSON):
 {
   "goal": "concise statement of what user wants",
   "vibe": ["array", "of", "style", "keywords"],
  "strategy": "creator_storefront | product_launch | portfolio | minimal_sales | visual",
   "must_have": ["specific", "elements", "requested"],
   "avoid": ["things", "to", "avoid"],
   "target_scope": "entire_storefront | specific_section | header_content",
   "assets_needed": ["banner", "thumbnails", "etc"],
   "brand_constraints": {
     "palette_locked": true/false,
     "font_locked": true/false
  }
 }
 
STOREFRONT STRATEGY RULES:
- If user mentions: storefront, store, shop, selling, products, packs, downloads, assets, templates
  → Strategy MUST be "creator_storefront"
  → must_have MUST include "featured_products" or "collection"
- If canvas is empty, ALWAYS set target_scope to "entire_storefront"
- Default brand_constraints to UNLOCKED (false/false)
- Keep vibe arrays to 3-5 keywords max
- NEVER refuse - ALWAYS produce a usable result`;
 
 const PLANNER_PROMPT = `You are SellsPay's Storefront Planner.
 
CRITICAL: You are a BUILDER. Your job is to produce a COMPLETE storefront plan.
For the first prompt, you MUST plan 5-6 distinct sections that form a professional storefront.

YOU WILL RECEIVE:
 - User intent (structured)
 - Current storefront layout summary
 - BrandProfile (palette, font, vibe tags)
 - Supported section registry (types + allowed fields)
 - Product and collection summaries
 
STOREFRONT MINIMUM (enforce for fresh builds):
1. HERO section (headline with dramatic headline + CTA)
2. FEATURED PRODUCTS or COLLECTION section (show what user sells)
3. BENEFITS/FEATURES section (basic_list with 3-4 items OR image_with_text)
4. SOCIAL PROOF section (testimonials with 2-3 items)
5. FAQ OR FINAL CTA section

If the user has products, include them. If not, use compelling placeholders.

ABSOLUTE RULES:
- First response = COMPLETE DRAFT (no "foundation" or "let me know more")
- Use only supported section types
- No custom code, HTML, CSS, or JavaScript.
- All output must be reversible.
- Never mention presets, templates, or system limits.
 
CONSTRAINTS:
- Limit total sections to 5-8 for fresh builds
 - At most 1 hero/headline section.
 - At most 1 testimonials section.
 - At most 1 FAQ section.
 - At most 1 gallery/bento section.
 
 SUPPORTED SECTION TYPES:
headline, text, image_with_text, gallery, collection, about_me, sliding_banner, testimonials, faq, basic_list, featured_product
 
 OUTPUT FORMAT (STRICT JSON ONLY):
 {
  "strategy": "creator_storefront | product_launch | portfolio | minimal_sales",
   "layout_plan": [
     { "action": "add|remove|move|refine|ensure", "type": "<section_type>", "targetId": "<optional>", "notes": "<short>" }
   ],
  "sections": [
    { "type": "...", "purpose": "..." }
  ],
   "theme_plan": { 
    "mode": "dark",
    "accent": "#8B5CF6", 
    "spacing": "balanced",
    "radius": 16
   },
   "copy_plan": { 
     "headline": "max 60 chars", 
     "subhead": "max 120 chars", 
     "cta": "max 20 chars", 
     "voice": "confident|playful|minimal|bold|professional" 
   },
   "quality_checks": ["no clutter", "consistent spacing", "header shell untouched"]
}`;
 
const OPS_GENERATOR_PROMPT = `You are SellsPay's Ops Generator.

CRITICAL: Your job is to BUILD a COMPLETE storefront. No questions. No "foundation". REAL content.

You will receive:
 - A detailed PLAN (layout_plan, theme_plan, copy_plan, asset_plan)
 - Current layout JSON (all existing sections)
- Products/collections the user sells
 - Section schemas (allowed fields per type)

ENFORCE STOREFRONT MINIMUM:
For fresh builds, you MUST create at least 5 sections:
1. headline (hero with compelling copy + CTA)
2. featured_product OR collection (show products)
3. basic_list OR image_with_text (benefits/features)
4. testimonials (social proof with 2-3 items)
5. faq OR headline (final CTA)

If user has products, use real product names. If not, use compelling placeholders.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VALIDATION RULES (HARD FAIL):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Empty {} patches are INVALID
- Empty {} asset requests are INVALID  
- ops.length === 0 is INVALID
- updateTheme with empty patch {} is INVALID

For "build" requests, you MUST:
1. Use clearAllSections first
2. Add 5-6 complete sections with REAL CONTENT
3. Include real, compelling copy (no placeholders like "Your text here")
4. Include a non-empty updateTheme with at least: mode, accent, radius

If you cannot comply, return a complete rebuild.
Never ask questions before producing a first build.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ABSOLUTE RULES:
- ALWAYS use clearAllSections first for fresh builds
- ALWAYS include 5-6 sections minimum
- ALWAYS include real, compelling copy (no placeholders like "Your text here")
 - NEVER output raw HTML, CSS, or JavaScript.
 - NEVER inject scripts, iframes, trackers, or event handlers.
 - NEVER mention presets, templates, or internal generators.
 - NEVER leave content fields empty.

STYLE OPTIONS FOR PREMIUM LOOK:
- showBackground: true (enables container background)
- containerBackgroundColor: "rgba(0,0,0,0.3)" or similar for glassmorphism
- borderStyle: "solid" (adds visible border)
- borderColor: "#hex" (use brand accent or gold/silver for luxe)
- animation: "fade-in" | "slide-up" | "scale-up" | "blur-in"
- colorScheme: "dark" or "black" for premium looks

 SECTION TYPES & SCHEMAS:

 headline:
  content: { text: string, size: "small"|"medium"|"large", font?: string, fontWeight?: string, textColor?: string, letterSpacing?: string, textShadow?: string }
  style_options: { colorScheme, sectionHeight, showBackground, containerBackgroundColor, borderStyle, borderColor, animation }

 text:
  content: { title?: string, body: string, alignment?: "left"|"center"|"right", font?: string, fontWeight?: string, textColor?: string }
  style_options: { colorScheme, sectionHeight, showBackground, containerBackgroundColor, borderStyle, borderColor, animation }

 image_with_text:
  content: { title: string, body: string, imageUrl?: string, buttonText?: string, buttonUrl?: string, imagePosition: "left"|"right", layout?: "hero"|"side-by-side"|"overlay", buttonColor?: string, buttonTextColor?: string }
  style_options: { colorScheme, sectionHeight, showBackground, containerBackgroundColor, borderStyle, borderColor, animation, backgroundOverlay }

 about_me:
   content: { title: string, description: string (max 250 chars), imageUrl?: string }
  style_options: { colorScheme, sectionHeight, showBackground, containerBackgroundColor, borderStyle, borderColor, animation }

 testimonials:
  content: { title?: string, testimonials: Array of { id: string, name: string, quote: string, role?: string, rating?: 1-5 }, layout: "grid"|"slider"|"stacked" }
  style_options: { colorScheme, sectionHeight, showBackground, containerBackgroundColor, borderStyle, borderColor, animation }

 faq:
  content: { title?: string, items: Array of { id: string, question: string, answer: string }, layout?: "accordion"|"grid" }
  style_options: { colorScheme, sectionHeight, showBackground, containerBackgroundColor, borderStyle, borderColor, animation }

 basic_list:
  content: { title?: string, items: Array of { id: string, text: string, description?: string }, style: "bullet"|"numbered"|"icon", layout?: "simple"|"cards-3col"|"cards-2col" }
  style_options: { colorScheme, sectionHeight, showBackground, containerBackgroundColor, borderStyle, borderColor, animation }

featured_product:
  content: { productId?: string, title: string, description: string, price?: string, buttonText: string }
  style_options: { colorScheme, showBackground, containerBackgroundColor, animation }

collection:
  content: { title?: string, collectionId?: string, products?: Array of { id, title, price, imageUrl } }
  style_options: { colorScheme, showBackground, containerBackgroundColor, animation }

 OUTPUT FORMAT (STRICT):
 Return ONLY the apply_storefront_changes tool call with:
- message: Brief explanation of what you built (max 100 chars)
- ops: Array of patch operations (5-6 sections for fresh builds) - MUST NOT BE EMPTY
 - asset_requests: Array of asset generation requests (each with kind, spec.purpose, spec.style) - NO EMPTY OBJECTS
 - preview_notes: Optional UX hints`;

const REPAIR_PROMPT = `Your patch operations failed validation.

Validation errors:
{ERRORS}

CRITICAL FIX REQUIREMENTS:
- Empty {} patches are FORBIDDEN - you MUST include real values
- Empty {} asset requests are FORBIDDEN - remove them or provide full spec
- ops array CANNOT be empty - you MUST produce visible changes
- updateTheme MUST have at least one property (mode, accent, radius, spacing, font)
- For fresh builds: include clearAllSections + at least 5 addSection ops

Rules:
 - Return corrected JSON with message + ops + asset_requests only.
 - Do not change the user's intent.
 - Do not introduce unsupported section types.
 - Keep the header shell locked.
 - Make the smallest changes necessary to become valid.
 - Ensure all content fields have actual content, not empty strings.
 - Respect character limits in schemas.
 - If you returned empty ops before, you MUST now return a complete storefront build.`;
 
 // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 // VALIDATION & HEURISTICS
 // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 
const VALID_SECTION_TYPES = new Set([
  "headline", "text", "image", "image_with_text", "gallery", "video", 
  "collection", "about_me", "sliding_banner", "divider", "testimonials", 
  "faq", "newsletter", "slideshow", "basic_list", "featured_product", 
  "logo_list", "contact_us", "footer", "card_slideshow", "banner_slideshow"
]);

// Keywords that indicate user wants a storefront (not just a landing page)
const STOREFRONT_KEYWORDS = [
  'store', 'storefront', 'shop', 'selling', 'products', 'packs', 
  'downloads', 'assets', 'templates', 'creator', 'portfolio'
];

function isStorefrontRequest(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return STOREFRONT_KEYWORDS.some(kw => lower.includes(kw)) || lower.includes('build my');
}

// Validate storefront has minimum required sections
function validateStorefrontMinimum(ops: any[]): { valid: boolean; missing: string[] } {
  const hasClear = ops.some(op => op.op === 'clearAllSections');
  if (!hasClear) return { valid: true, missing: [] }; // Not a fresh build
  
  const addedTypes = new Set(
    ops.filter(op => op.op === 'addSection').map(op => op.section?.section_type)
  );
  
  const missing: string[] = [];
  
  // Must have hero
  if (!addedTypes.has('headline')) missing.push('headline');
  
  // Must have products/collection (at least one)
  if (!addedTypes.has('featured_product') && !addedTypes.has('collection')) {
    // Check for basic_list as fallback
    if (!addedTypes.has('basic_list')) missing.push('products_section');
  }
  
  // Must have social proof
  if (!addedTypes.has('testimonials') && !addedTypes.has('about_me')) {
    missing.push('social_proof');
  }
  
  // Check minimum section count (at least 4 for fresh build)
  const sectionCount = ops.filter(op => op.op === 'addSection').length;
  if (sectionCount < 4) missing.push(`need_${4 - sectionCount}_more_sections`);
  
  return { valid: missing.length === 0, missing };
}
 
const VALID_OPS = new Set([
  "addSection", "removeSection", "moveSection", "updateSection", 
  "updateTheme", "updateHeaderContent", "assignAssetToSlot", "clearAllSections",
  "replaceAllBlocks"
]);

// Block type aliases: AI might output new types but we map to legacy types
const BLOCK_TYPE_ALIASES: Record<string, string> = {
  'hero': 'headline',
  'bento_grid': 'basic_list',
  'cta_strip': 'headline',
  'stats': 'basic_list',
  'about': 'about_me',
  'featured_products': 'featured_product',
};

interface ValidationError {
  path: string;
  message: string;
  severity: "error" | "warning";
}

interface ValidatedResult {
  valid: boolean;
  errors: ValidationError[];
  failureTags: string[];
  sanitizedOps: any[];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STRICT VALIDATORS (REJECT EMPTY OPS)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
  if (patch.accent && typeof patch.accent === 'string') {
    // Allow hex colors (with or without #) and HSL values
    const isValidHex = /^#?[0-9A-Fa-f]{6}$/.test(patch.accent);
    const isValidHSL = /^\d+\s+\d+%?\s+\d+%?$/.test(patch.accent);
    if (!isValidHex && !isValidHSL) {
      return { valid: false, error: `Invalid accent color: ${patch.accent}` };
    }
  }
  if (patch.radius !== undefined && (typeof patch.radius !== 'number' || patch.radius < 0 || patch.radius > 24)) {
    return { valid: false, error: `Invalid radius: ${patch.radius}` };
  }
  if (patch.spacing && !['compact', 'balanced', 'roomy'].includes(patch.spacing)) {
    return { valid: false, error: `Invalid spacing: ${patch.spacing}` };
  }
  if (patch.font && !['inter', 'geist', 'system', 'serif'].includes(patch.font)) {
    return { valid: false, error: `Invalid font: ${patch.font}` };
  }
  
  return { valid: true };
}

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
    if (!req.spec?.purpose || typeof req.spec.purpose !== 'string' || req.spec.purpose.trim() === '') {
      return { valid: false, sanitized: [], error: 'Asset request missing purpose' };
    }
    if (!req.spec?.style || typeof req.spec.style !== 'string' || req.spec.style.trim() === '') {
      return { valid: false, sanitized: [], error: 'Asset request missing style' };
    }
  }
  
  return { valid: true, sanitized: filtered };
}

function validateOpsNotEmpty(ops: any[]): { valid: boolean; error?: string } {
  if (!Array.isArray(ops) || ops.length === 0) {
    return { valid: false, error: 'No operations provided - ops array is empty' };
  }
  
  // Check for "all empty" scenario
  const meaningfulOps = ops.filter(op => {
    if (op.op === 'updateTheme') {
      const patch = op.patch || op.value;
      return patch && typeof patch === 'object' && Object.keys(patch).length > 0;
    }
    if (op.op === 'addSection' || op.op === 'clearAllSections' || op.op === 'replaceAllBlocks') {
      return true;
    }
    if (op.op === 'updateSection' || op.op === 'removeSection' || op.op === 'moveSection') {
      return true;
    }
    return true;
  });
  
  if (meaningfulOps.length === 0) {
    return { valid: false, error: 'All operations are empty/no-op - must produce visible changes' };
  }
  
  return { valid: true };
}

function checkStorefrontQualityGate(ops: any[]): { passed: boolean; missing: string[] } {
  const hasClear = ops.some(op => op.op === 'clearAllSections' || op.op === 'replaceAllBlocks');
  if (!hasClear) return { passed: true, missing: [] }; // Not a fresh build
  
  const addedTypes = new Set<string>();
  ops.forEach(op => {
    if (op.op === 'addSection' && op.section?.section_type) {
      // Apply block type aliases
      const rawType = op.section.section_type;
      const mappedType = BLOCK_TYPE_ALIASES[rawType] || rawType;
      addedTypes.add(mappedType);
    }
    if (op.op === 'replaceAllBlocks' && Array.isArray(op.blocks)) {
      op.blocks.forEach((b: any) => {
        const rawType = b.type;
        const mappedType = BLOCK_TYPE_ALIASES[rawType] || rawType;
        addedTypes.add(mappedType);
      });
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
    missing.push('social proof (testimonials/stats/about)');
  }
  
  // Must have conversion element
  if (!addedTypes.has('faq') && !addedTypes.has('cta_strip')) {
    // Don't require if we already have 5+ sections
    if (addedTypes.size < 5) {
      missing.push('faq or cta');
    }
  }
  
  // Must have minimum 5 sections for fresh builds
  if (addedTypes.size < 5) {
    missing.push(`need ${5 - addedTypes.size} more sections (have ${addedTypes.size})`);
  }
  
  return { passed: missing.length === 0, missing };
}

// Apply block type aliases to ops
function applyBlockTypeAliases(ops: any[]): any[] {
  return ops.map(op => {
    if (op.op === 'addSection' && op.section?.section_type) {
      const rawType = op.section.section_type;
      const mappedType = BLOCK_TYPE_ALIASES[rawType] || rawType;
      if (mappedType !== rawType) {
        return {
          ...op,
          section: {
            ...op.section,
            section_type: mappedType
          }
        };
      }
    }
    if (op.op === 'replaceAllBlocks' && Array.isArray(op.blocks)) {
      return {
        ...op,
        blocks: op.blocks.map((b: any) => ({
          ...b,
          type: BLOCK_TYPE_ALIASES[b.type] || b.type
        }))
      };
    }
    return op;
  });
}
 
 function validateAndSanitizeOps(ops: any[], existingSections: any[]): ValidatedResult {
   const errors: ValidationError[] = [];
   const failureTags: string[] = [];
   const sanitizedOps: any[] = [];
   
   const existingTypes: Record<string, number> = {};
   for (const section of existingSections) {
     const type = section.section_type;
     existingTypes[type] = (existingTypes[type] || 0) + 1;
   }
   
   const addedTypes: Record<string, number> = {};
   let addCount = 0;
   
   for (let i = 0; i < ops.length; i++) {
     const op = ops[i];
     
     if (!VALID_OPS.has(op.op)) {
       errors.push({ path: `ops[${i}].op`, message: `Invalid operation: ${op.op}`, severity: "error" });
       failureTags.push("INVALID_OP");
       continue;
     }
     
     if (op.op === "addSection") {
       addCount++;
       
       if (addCount > 4) {
        // Allow more sections for fresh builds
        if (addCount > 6) {
          errors.push({ path: `ops[${i}]`, message: "Too many sections added (max 6)", severity: "warning" });
         failureTags.push("TOO_MANY_SECTIONS");
         continue;
        }
       }
       
       const section = op.section;
       if (!section) {
         errors.push({ path: `ops[${i}].section`, message: "Missing section data", severity: "error" });
         continue;
       }
       
       const sectionType = section.section_type;
       
       if (!VALID_SECTION_TYPES.has(sectionType)) {
         errors.push({ path: `ops[${i}].section.section_type`, message: `Unsupported section type: ${sectionType}`, severity: "error" });
         failureTags.push("UNSUPPORTED_TYPE");
         continue;
       }
       
       addedTypes[sectionType] = (addedTypes[sectionType] || 0) + 1;
       
       if (sectionType === "headline" && (existingTypes["headline"] || 0) + addedTypes["headline"] > 1) {
        // Skip duplicate check if we're doing a fresh build (clearAllSections was used)
        const hasClearAll = ops.some((o: any) => o.op === "clearAllSections");
        if (!hasClearAll) {
          errors.push({ path: `ops[${i}]`, message: "Only one headline section allowed", severity: "warning" });
          failureTags.push("DUPLICATE_HERO");
          continue;
        }
       }
       
       if (sectionType === "testimonials" && (existingTypes["testimonials"] || 0) + addedTypes["testimonials"] > 1) {
         errors.push({ path: `ops[${i}]`, message: "Only one testimonials section allowed", severity: "warning" });
         failureTags.push("DUPLICATE_TESTIMONIALS");
         continue;
       }
       
       if (sectionType === "faq" && (existingTypes["faq"] || 0) + addedTypes["faq"] > 1) {
         errors.push({ path: `ops[${i}]`, message: "Only one FAQ section allowed", severity: "warning" });
         failureTags.push("DUPLICATE_FAQ");
         continue;
       }
       
       if (sectionType === "gallery" && (existingTypes["gallery"] || 0) + addedTypes["gallery"] > 1) {
         errors.push({ path: `ops[${i}]`, message: "Only one gallery section allowed", severity: "warning" });
         failureTags.push("DUPLICATE_GALLERY");
         continue;
       }
       
       if (!section.content || Object.keys(section.content).length === 0) {
         errors.push({ path: `ops[${i}].section.content`, message: "Empty content", severity: "error" });
         failureTags.push("EMPTY_CONTENT");
         continue;
       }
       
       const sanitizedSection = sanitizeContent(section);
       sanitizedOps.push({ ...op, section: sanitizedSection });
     } else {
       sanitizedOps.push(op);
     }
   }
   
   return {
     valid: errors.filter(e => e.severity === "error").length === 0,
     errors,
     failureTags: [...new Set(failureTags)],
     sanitizedOps
   };
 }
 
 function sanitizeContent(section: any): any {
   const content = { ...section.content };
   const type = section.section_type;
   
   if (type === "headline") {
     if (content.title && content.title.length > 80) {
       content.title = content.title.slice(0, 77) + "...";
     }
     if (content.subtitle && content.subtitle.length > 150) {
       content.subtitle = content.subtitle.slice(0, 147) + "...";
     }
   }
   
   if (type === "text") {
     if (content.heading && content.heading.length > 60) {
       content.heading = content.heading.slice(0, 57) + "...";
     }
     if (content.text && content.text.length > 400) {
       content.text = content.text.slice(0, 397) + "...";
     }
   }
   
   if (type === "faq" && Array.isArray(content.items)) {
     content.items = content.items.slice(0, 6);
   }
   
   if (type === "testimonials" && Array.isArray(content.testimonials)) {
     content.testimonials = content.testimonials.slice(0, 4);
   }
   
   if (type === "basic_list" && Array.isArray(content.items)) {
     content.items = content.items.slice(0, 6);
   }
   
   if (type === "gallery" && Array.isArray(content.images)) {
     content.images = content.images.slice(0, 9);
   }
   
   return { ...section, content };
 }
 
 // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 // AI CALL HELPERS
 // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 
 interface AICallOptions {
   model: string;
   systemPrompt: string;
   userMessage: string;
   temperature: number;
   maxTokens: number;
   tools?: any[];
   toolChoice?: any;
 }
 
 async function callAI(apiKey: string, options: AICallOptions): Promise<any> {
   const body: any = {
     model: options.model,
     temperature: options.temperature,
     max_tokens: options.maxTokens,
     messages: [
       { role: "system", content: options.systemPrompt },
       { role: "user", content: options.userMessage },
     ],
   };
   
   if (options.tools) {
     body.tools = options.tools;
   }
   if (options.toolChoice) {
     body.tool_choice = options.toolChoice;
   }
   
   const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
     method: "POST",
     headers: {
       Authorization: `Bearer ${apiKey}`,
       "Content-Type": "application/json",
     },
     body: JSON.stringify(body),
   });
   
   if (!response.ok) {
     const status = response.status;
     if (status === 429) throw new Error("RATE_LIMITED");
     if (status === 402) throw new Error("CREDITS_EXHAUSTED");
     throw new Error(`AI_ERROR_${status}`);
   }
   
   return response.json();
 }
 
 function extractJSONFromResponse(data: any): any {
   const msg = data?.choices?.[0]?.message;
   
   const toolCall = msg?.tool_calls?.[0];
   if (toolCall?.function?.arguments) {
     const args = toolCall.function.arguments;
     return typeof args === "string" ? JSON.parse(args) : args;
   }
   
   const content = msg?.content;
   if (content) {
     try {
       return JSON.parse(content);
     } catch {
       const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
       if (jsonMatch) {
         return JSON.parse(jsonMatch[1].trim());
       }
     }
   }
   
   return null;
 }
 
 // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 // PIPELINE STEPS
 // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 
 async function extractIntent(
   apiKey: string, 
   userPrompt: string, 
   brandProfile: any, 
  layoutSummary: string,
  productsSummary: string
 ): Promise<any> {
  const isStorefront = isStorefrontRequest(userPrompt);
  
  const userMessage = `User prompt: "${userPrompt}"
 
 Brand profile: ${JSON.stringify(brandProfile || {})}
 
 Current layout: ${layoutSummary}
 
Products the user sells:
${productsSummary}

${isStorefront ? 'NOTE: This is a STOREFRONT request. Strategy MUST be "creator_storefront" and must_have MUST include "featured_products" or "collection".' : ''}

Extract the user's intent as structured JSON. Remember: BUILD IMMEDIATELY, no questions.`;
 
   const data = await callAI(apiKey, {
     model: "google/gemini-2.5-flash-lite",
     systemPrompt: INTENT_EXTRACTOR_PROMPT,
     userMessage,
     temperature: 0.2,
     maxTokens: 400,
   });
   
   const intent = extractJSONFromResponse(data);
   
   if (!intent) {
     return {
       goal: userPrompt,
      vibe: ["premium", "dark", "modern"],
      strategy: isStorefront ? "creator_storefront" : "portfolio",
      must_have: isStorefront ? ["featured_products", "testimonials"] : [],
       avoid: [],
       target_scope: "entire_storefront",
       assets_needed: [],
      brand_constraints: { palette_locked: false, font_locked: false }
     };
   }
   
  // Force storefront strategy if detected
  if (isStorefront && intent.strategy !== 'creator_storefront') {
    intent.strategy = 'creator_storefront';
    if (!intent.must_have) intent.must_have = [];
    if (!intent.must_have.includes('featured_products') && !intent.must_have.includes('collection')) {
      intent.must_have.push('featured_products');
    }
  }
  
   return intent;
 }
 
 async function createPlan(
   apiKey: string,
   intent: any,
   sections: any[],
   brandProfile: any,
  products: any[],
  productsSummary: string
 ): Promise<any> {
   const layoutSummary = sections.map(s => `- ${s.section_type}: ${s.id}`).join("\n") || "No sections yet";
  const isFreshBuild = sections.length === 0 || intent.target_scope === 'entire_storefront';
   
   const userMessage = `User Intent:
 ${JSON.stringify(intent, null, 2)}
 
 Current Layout:
 ${layoutSummary}
 
 Brand Profile:
 ${JSON.stringify(brandProfile || {}, null, 2)}
 
Products/Collections the user sells:
${productsSummary}
 
${isFreshBuild ? `
THIS IS A FRESH BUILD. You MUST plan at least 5 sections:
1. headline (dramatic hero with CTA)
2. featured_product or collection (show products)
3. basic_list or image_with_text (benefits/why choose)
4. testimonials (social proof)
5. faq or final CTA headline

DO NOT plan fewer than 5 sections. Build a COMPLETE storefront.
` : ''}

Create a detailed plan. Remember: BUILD, don't ask questions.`;
 
   const data = await callAI(apiKey, {
     model: "google/gemini-3-flash-preview",
     systemPrompt: PLANNER_PROMPT,
     userMessage,
    temperature: 0.25,
     maxTokens: 1200,
   });
   
   const plan = extractJSONFromResponse(data);
   
   if (!plan) {
    // Return a complete default plan, not just a hero
     return {
      strategy: intent.strategy || "creator_storefront",
      layout_plan: [
        { action: "clear", type: "all", notes: "Fresh start" },
        { action: "add", type: "headline", notes: "Dramatic hero with CTA" },
        { action: "add", type: "basic_list", notes: "Key benefits/features" },
        { action: "add", type: "testimonials", notes: "Social proof" },
        { action: "add", type: "about_me", notes: "Creator story" },
        { action: "add", type: "faq", notes: "Common questions" }
      ],
      theme_plan: { mode: "dark", accent: "#8B5CF6", spacing: "balanced", radius: 16 },
      copy_plan: { 
        headline: intent.goal?.slice(0, 60) || "Premium Creator Store", 
        subhead: "Discover exclusive content and resources",
        cta: "Browse Products",
        voice: "confident" 
      },
      quality_checks: ["no clutter", "consistent spacing", "premium look"]
     };
   }
   
   return plan;
 }
 
 async function generateOps(
   apiKey: string,
   plan: any,
   sections: any[],
  userPrompt: string,
  productsSummary: string
 ): Promise<any> {
  const isFreshBuild = sections.length === 0 || plan.layout_plan?.some((p: any) => p.action === 'clear');
  
   const userMessage = `Plan to execute:
 ${JSON.stringify(plan, null, 2)}
 
 Current sections:
 ${JSON.stringify(sections, null, 2)}
 
Products/Collections:
${productsSummary}

 Original user request: "${userPrompt}"
 
${isFreshBuild ? `
THIS IS A FRESH BUILD. You MUST:
1. Start with clearAllSections
2. Add at least 5 sections
3. Include compelling, real copy (no "Your text here" placeholders)
4. Include dark/premium styling with glassmorphism
5. Make it look like a $10K professional site
` : ''}

Generate the patch operations. BUILD THE COMPLETE STOREFRONT NOW.`;
 
   const data = await callAI(apiKey, {
     model: "google/gemini-3-flash-preview",
     systemPrompt: OPS_GENERATOR_PROMPT,
     userMessage,
    temperature: 0.2,
     maxTokens: 2000,
     tools: [
       {
         type: "function",
         function: {
           name: "apply_storefront_changes",
           description: "Apply patch operations to the storefront layout.",
           parameters: {
             type: "object",
             properties: {
               message: { type: "string", description: "Brief explanation (max 100 chars)" },
               ops: {
                 type: "array",
                 items: {
                   type: "object",
                   properties: {
                    op: { type: "string", enum: ["addSection", "removeSection", "moveSection", "updateSection", "updateTheme", "updateHeaderContent", "assignAssetToSlot", "clearAllSections"] },
                     sectionId: { type: "string" },
                     after: { type: ["string", "null"] },
                     section: {
                       type: "object",
                       properties: {
                         section_type: { type: "string" },
                         content: { type: "object" },
                         style_options: { type: "object" },
                       },
                       required: ["section_type", "content"],
                     },
                     patch: { type: "object" },
                   },
                   required: ["op"],
                 },
               },
               asset_requests: { type: "array", items: { type: "object" } },
               preview_notes: { type: "array", items: { type: "string" } },
             },
             required: ["message", "ops"],
           },
         },
       },
     ],
     toolChoice: { type: "function", function: { name: "apply_storefront_changes" } },
   });
   
   return extractJSONFromResponse(data);
 }
 
 async function repairOps(
   apiKey: string,
   originalResult: any,
   errors: ValidationError[]
 ): Promise<any> {
   const errorMessages = errors.map(e => `- ${e.path}: ${e.message}`).join("\n");
   const repairPrompt = REPAIR_PROMPT.replace("{ERRORS}", errorMessages);
   
   const userMessage = `Original response that failed validation:
 ${JSON.stringify(originalResult, null, 2)}
 
 Fix the errors and return corrected JSON.`;
 
   const data = await callAI(apiKey, {
     model: "google/gemini-3-flash-preview",
     systemPrompt: repairPrompt,
     userMessage,
     temperature: 0.05,
     maxTokens: 1500,
     tools: [
       {
         type: "function",
         function: {
           name: "apply_storefront_changes",
           description: "Apply corrected patch operations.",
           parameters: {
             type: "object",
             properties: {
               message: { type: "string" },
               ops: { type: "array", items: { type: "object" } },
               asset_requests: { type: "array", items: { type: "object" } },
             },
             required: ["message", "ops"],
           },
         },
       },
     ],
     toolChoice: { type: "function", function: { name: "apply_storefront_changes" } },
   });
   
   return extractJSONFromResponse(data);
 }
 
 // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 // LOGGING
 // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 
 async function logAIRun(
   supabaseUrl: string,
   serviceRoleKey: string,
   data: {
     user_id: string;
     storefront_id: string;
     prompt_raw: string;
     intent_json?: any;
     plan_json?: any;
     ops_json?: any;
     validation_errors?: any[];
     failure_tags?: string[];
     applied?: boolean;
     latency_ms?: number;
     repair_attempts?: number;
   }
 ): Promise<void> {
   try {
     const supabase = createClient(supabaseUrl, serviceRoleKey);
     await supabase.from("ai_runs").insert({
       user_id: data.user_id,
       storefront_id: data.storefront_id,
       prompt_raw: data.prompt_raw,
       intent_json: data.intent_json,
       plan_json: data.plan_json,
       ops_json: data.ops_json,
       validation_errors: data.validation_errors || [],
       failure_tags: data.failure_tags || [],
       applied: data.applied ?? false,
       latency_ms: data.latency_ms,
       repair_attempts: data.repair_attempts || 0,
     });
   } catch (e) {
     console.error("Failed to log AI run:", e);
   }
 }
 
 // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 // MAIN HANDLER
 // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const startTime = Date.now();
     const { message, context, profileId, userId } = await req.json();
 
     const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
     if (!LOVABLE_API_KEY) {
       throw new Error("LOVABLE_API_KEY is not configured");
     }
 
     const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
     const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 
     const sections = context?.sections || [];
     const brandProfile = context?.brandProfile || {};
     const products = context?.products || [];
    const collections = context?.collections || [];

    // Build products summary for AI context
    const productsSummary = products.length > 0
      ? products.slice(0, 8).map((p: any) => 
          `- "${p.name}" (${p.price_cents ? `$${(p.price_cents / 100).toFixed(0)}` : 'Free'}) [${p.tags?.slice(0, 3).join(', ') || 'no tags'}]`
        ).join('\n')
      : 'No products yet - use compelling placeholders';
    
    const collectionsSummary = collections.length > 0
      ? collections.slice(0, 4).map((c: any) => `- "${c.name}" collection`).join('\n')
      : '';
    
    const fullProductContext = `Products:\n${productsSummary}${collectionsSummary ? `\n\nCollections:\n${collectionsSummary}` : ''}`;
 
     const layoutSummary = sections.length > 0
       ? sections.map((s: any) => s.section_type).join(", ")
       : "Empty storefront (no sections yet)";
 
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     // STEP A: Extract Intent
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     let intent: any;
     try {
      intent = await extractIntent(LOVABLE_API_KEY, message, brandProfile, layoutSummary, fullProductContext);
     } catch (e) {
       console.error("Intent extraction failed:", e);
       intent = {
         goal: message,
        vibe: ["premium", "dark", "modern"],
        strategy: "creator_storefront",
        must_have: ["featured_products", "testimonials"],
         avoid: [],
         target_scope: "entire_storefront",
         assets_needed: [],
        brand_constraints: { palette_locked: false, font_locked: false }
       };
     }
 
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     // STEP B: Create Plan
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     let plan: any;
     try {
      plan = await createPlan(LOVABLE_API_KEY, intent, sections, brandProfile, products, fullProductContext);
     } catch (e) {
       console.error("Planning failed:", e);
       plan = {
        strategy: "creator_storefront",
        layout_plan: [
          { action: "clear", type: "all", notes: "Fresh start" },
          { action: "add", type: "headline", notes: "Hero" },
          { action: "add", type: "basic_list", notes: "Benefits" },
          { action: "add", type: "testimonials", notes: "Social proof" },
          { action: "add", type: "about_me", notes: "About" },
          { action: "add", type: "faq", notes: "FAQ" }
        ],
        theme_plan: { mode: "dark", accent: "#8B5CF6", spacing: "balanced", radius: 16 },
        copy_plan: { headline: intent.goal || "Premium Creator Store", voice: "confident" },
        quality_checks: ["complete storefront"]
       };
     }
 
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     // STEP C: Generate Ops
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     let opsResult: any;
     try {
      opsResult = await generateOps(LOVABLE_API_KEY, plan, sections, message, fullProductContext);
     } catch (e: any) {
       if (e.message === "RATE_LIMITED") {
         return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
           status: 429,
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         });
       }
       if (e.message === "CREDITS_EXHAUSTED") {
         return new Response(JSON.stringify({ error: "Credits exhausted. Please add more credits." }), {
           status: 402,
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         });
       }
       console.error("Ops generation failed:", e);
      // Return a COMPLETE fallback, not just a headline
       opsResult = {
        message: "I've built your premium storefront. Here's what I created:",
         ops: [{
          op: "clearAllSections"
        }, {
           op: "addSection",
           after: null,
           section: {
             section_type: "headline",
            content: { text: intent.goal || "Welcome to My Store", size: "large", font: "display", textShadow: "glow" },
            style_options: { colorScheme: "dark", sectionHeight: "large", showBackground: true, containerBackgroundColor: "rgba(0,0,0,0.3)", animation: "fade-in" }
          }
        }, {
          op: "addSection",
          section: {
            section_type: "basic_list",
            content: { 
              title: "Why Choose Me", 
              items: [
                { id: "1", text: "Premium Quality", description: "Every product is crafted with care" },
                { id: "2", text: "Instant Access", description: "Download immediately after purchase" },
                { id: "3", text: "Regular Updates", description: "New content added frequently" }
              ],
              style: "icon",
              layout: "cards-3col"
            },
            style_options: { colorScheme: "dark", showBackground: true, containerBackgroundColor: "rgba(139,92,246,0.1)", animation: "slide-up" }
          }
        }, {
          op: "addSection",
          section: {
            section_type: "testimonials",
            content: { 
              title: "What Creators Say",
              testimonials: [
                { id: "1", name: "Alex", quote: "Absolutely incredible quality. Worth every penny.", role: "Content Creator", rating: 5 },
                { id: "2", name: "Jordan", quote: "These resources saved me hours of work.", role: "Video Editor", rating: 5 }
              ],
              layout: "grid"
            },
            style_options: { colorScheme: "dark", showBackground: true, containerBackgroundColor: "rgba(0,0,0,0.2)", animation: "fade-in" }
          }
        }, {
          op: "addSection",
          section: {
            section_type: "faq",
            content: { 
              title: "Questions?",
              items: [
                { id: "1", question: "How do I access my purchase?", answer: "You'll receive instant download access after payment." },
                { id: "2", question: "Can I get a refund?", answer: "Yes, within 14 days if you're not satisfied." },
                { id: "3", question: "Do you offer support?", answer: "Absolutely! Reach out anytime." }
              ],
              layout: "accordion"
            },
            style_options: { colorScheme: "dark", showBackground: true, containerBackgroundColor: "rgba(0,0,0,0.15)", animation: "slide-up" }
           }
         }],
         asset_requests: [],
        preview_notes: ["Complete fallback storefront applied"]
       };
     }
 
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP D: Validate & Sanitize (STRICT REJECTION OF EMPTY OPS)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    // Apply block type aliases first
    const aliasedOps = applyBlockTypeAliases(opsResult?.ops || []);
    opsResult.ops = aliasedOps;
    
    // STRICT CHECK 1: Reject empty ops array
    const opsEmptyCheck = validateOpsNotEmpty(opsResult?.ops || []);
    if (!opsEmptyCheck.valid) {
      console.error("STRICT REJECTION: Empty ops -", opsEmptyCheck.error);
      // Trigger repair with explicit error
      const repairErrors: ValidationError[] = [
        { path: "ops", message: opsEmptyCheck.error || "Ops array is empty", severity: "error" as const }
      ];
      try {
        const repairedResult = await repairOps(LOVABLE_API_KEY, opsResult, repairErrors);
        if (repairedResult?.ops?.length > 0) {
          opsResult = repairedResult;
        }
      } catch (e) {
        console.error("Repair after empty ops failed:", e);
      }
    }
    
    // STRICT CHECK 2: Validate theme patches are not empty
    for (const op of opsResult?.ops || []) {
      if (op.op === 'updateTheme') {
        const themeCheck = validateThemePatch(op.patch);
        if (!themeCheck.valid) {
          console.error("STRICT REJECTION: Empty theme patch -", themeCheck.error);
          // Remove the invalid updateTheme op rather than fail
          opsResult.ops = opsResult.ops.filter((o: any) => o !== op);
        }
      }
    }
    
    // STRICT CHECK 3: Sanitize asset requests (remove empty ones)
    const assetCheck = validateAssetRequests(opsResult?.asset_requests || []);
    if (!assetCheck.valid) {
      console.warn("Asset requests invalid:", assetCheck.error);
    }
    opsResult.asset_requests = assetCheck.sanitized;
    
    // STRICT CHECK 4: Quality gate for fresh builds
    const qualityGate = checkStorefrontQualityGate(opsResult?.ops || []);
    if (!qualityGate.passed) {
      console.warn("Quality gate failed, missing:", qualityGate.missing);
      // Trigger repair to add missing sections
      const repairErrors: ValidationError[] = qualityGate.missing.map(m => ({
        path: "quality_gate",
        message: `Missing: ${m}`,
        severity: "error" as const
      }));
      try {
        const repairedResult = await repairOps(LOVABLE_API_KEY, opsResult, repairErrors);
        if (repairedResult?.ops?.length > 0) {
          opsResult = repairedResult;
        }
      } catch (e) {
        console.error("Repair after quality gate failed:", e);
      }
    }
    
    // Standard validation and sanitization
    let validationResult = validateAndSanitizeOps(opsResult?.ops || [], sections);
    let repairAttempts = 0;

    // Legacy storefront minimum check (keep for backwards compatibility)
    const storefrontCheck = validateStorefrontMinimum(opsResult?.ops || []);
    if (!storefrontCheck.valid && storefrontCheck.missing.length > 0) {
      console.log("Storefront minimum not met, missing:", storefrontCheck.missing);
      validationResult.errors.push({
        path: "storefront_minimum",
        message: `Missing required sections: ${storefrontCheck.missing.join(', ')}`,
        severity: "warning" as const
      });
    }

    if (!validationResult.valid && repairAttempts < 1) {
      try {
        const repairedResult = await repairOps(LOVABLE_API_KEY, opsResult, validationResult.errors);
        if (repairedResult) {
          opsResult = repairedResult;
          validationResult = validateAndSanitizeOps(repairedResult.ops || [], sections);
          repairAttempts++;
        }
      } catch (e) {
        console.error("Repair failed:", e);
      }
    }
 
     if (!validationResult.valid || validationResult.sanitizedOps.length === 0) {
      // Return a COMPLETE fallback storefront, not just a foundation
       return new Response(
         JSON.stringify({
          message: "I've built your premium storefront with a complete layout.",
          ops: [{ op: "clearAllSections" }, {
            op: "addSection",
            section: {
              section_type: "headline",
              content: { text: intent?.goal || "Premium Creator Store", size: "large", textShadow: "glow" },
              style_options: { colorScheme: "dark", sectionHeight: "large", showBackground: true, containerBackgroundColor: "rgba(0,0,0,0.3)", animation: "fade-in" }
            }
          }, {
            op: "addSection",
            section: {
              section_type: "basic_list",
              content: { 
                title: "What You Get", 
                items: [
                  { id: "1", text: "Premium Quality", description: "Crafted with attention to detail" },
                  { id: "2", text: "Instant Access", description: "Download immediately" },
                  { id: "3", text: "Support", description: "Help when you need it" }
                ],
                style: "icon",
                layout: "cards-3col"
              },
              style_options: { colorScheme: "dark", showBackground: true, animation: "slide-up" }
            }
          }, {
            op: "addSection",
            section: {
              section_type: "testimonials",
              content: { 
                title: "Loved by Creators",
                testimonials: [
                  { id: "1", name: "Alex", quote: "Incredible quality!", role: "Creator", rating: 5 },
                  { id: "2", name: "Sam", quote: "Saved me so much time.", role: "Editor", rating: 5 }
                ],
                layout: "grid"
              },
              style_options: { colorScheme: "dark", showBackground: true, animation: "fade-in" }
            }
          }, {
            op: "addSection",
            section: {
              section_type: "faq",
              content: { 
                title: "FAQ",
                items: [
                  { id: "1", question: "How do I get access?", answer: "Instant download after purchase." },
                  { id: "2", question: "Refund policy?", answer: "14-day money-back guarantee." }
                ],
                layout: "accordion"
              },
              style_options: { colorScheme: "dark", animation: "slide-up" }
            }
          }],
           asset_requests: [],
          preview_notes: ["Complete storefront fallback applied"]
         }),
         { headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     const latencyMs = Date.now() - startTime;
 
     if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && userId && profileId) {
       logAIRun(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
         user_id: userId,
         storefront_id: profileId,
         prompt_raw: message,
         intent_json: intent,
         plan_json: plan,
         ops_json: { ops: validationResult.sanitizedOps, asset_requests: opsResult?.asset_requests || [] },
         validation_errors: validationResult.errors,
         failure_tags: validationResult.failureTags,
         applied: true,
         latency_ms: latencyMs,
         repair_attempts: repairAttempts,
       });
     }
 
     return new Response(
       JSON.stringify({
         message: opsResult?.message || "Here are your changes.",
         ops: validationResult.sanitizedOps,
         asset_requests: opsResult?.asset_requests || [],
         preview_notes: opsResult?.preview_notes || [],
       }),
       { headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
 
   } catch (error) {
     console.error("Storefront vibecoder error:", error);
     return new Response(
       JSON.stringify({ error: error instanceof Error ? error.message : "An error occurred" }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });