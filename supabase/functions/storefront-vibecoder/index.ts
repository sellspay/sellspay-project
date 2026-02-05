 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 // PROMPTS FOR MULTI-STEP PIPELINE
 // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 
 const INTENT_EXTRACTOR_PROMPT = `You are SellsPay's Intent Extractor.
 
 Your job: Parse the user's natural language request into a structured intent object.

CRITICAL: When users ask for things like "premium", "glossy", "modern", "luxe", "minimal", "bold", etc., you must interpret these as DRAMATIC visual transformations, not subtle tweaks. Unlock all brand constraints unless explicitly told to keep existing styles.
 
 You will receive:
 - User prompt (raw text)
 - Brand profile summary (palette, font, vibe tags)
 - Current layout summary (section types present)
 
 OUTPUT FORMAT (STRICT JSON):
 {
   "goal": "concise statement of what user wants",
   "vibe": ["array", "of", "style", "keywords"],
   "must_have": ["specific", "elements", "requested"],
   "avoid": ["things", "to", "avoid"],
   "target_scope": "entire_storefront | specific_section | header_content",
   "assets_needed": ["banner", "thumbnails", "etc"],
   "brand_constraints": {
     "palette_locked": true/false,
     "font_locked": true/false
  },
  "intensity": "subtle | moderate | dramatic | complete_overhaul"
 }
 
 RULES:
 - Extract intent, don't invent requirements
 - Default target_scope to "entire_storefront" if unclear
- Default brand_constraints to UNLOCKED when user mentions style words like: premium, glossy, luxe, modern, elegant, bold, clean, minimal, dark, sleek, futuristic, cyberpunk, etc.
- When user asks to "make it look better/premium/etc", set intensity to "dramatic"
 - Keep vibe arrays to 3-5 keywords max
- If user mentions specific colors/fonts, set corresponding locked to false
- Style-focused prompts should default intensity to "dramatic" not "subtle"`;
 
 const PLANNER_PROMPT = `You are SellsPay's Storefront Planner.
 
 You will be given:
 - User intent (structured)
 - Current storefront layout summary
 - BrandProfile (palette, font, vibe tags)
 - Supported section registry (types + allowed fields)
 - Product and collection summaries
 
 Your job: produce a best-in-class PLAN to achieve the user's intent using ONLY supported sections and theme tokens.

CRITICAL DESIGN PHILOSOPHY:
When users ask for things like "premium", "glossy", "luxe", "modern", "sleek", "bold" - they want DRAMATIC, VISIBLE changes. This means:
- Change fonts dramatically (not just weight, but style)
- Add glassmorphism, gradients, shadows, glows
- Transform section backgrounds with overlays and effects
- Add borders with color
- Use animations aggressively
- Change entire color schemes
- Make sections feel completely different, not 5% tweaked
 
 HARD CONSTRAINTS:
 - The profile header shell is locked structurally. Do not plan structural edits to the header.
 - No custom code. Only supported sections.
 - Prefer fewer, stronger sections. Avoid clutter.
 - Your plan must be actionable and reversible.
 - If the user asks for something not directly supported, choose the closest supported alternative and note it.
 - Maximum 4 addSection operations per plan.
 - At most 1 hero/headline section.
 - At most 1 testimonials section.
 - At most 1 FAQ section.
 - At most 1 gallery/bento section.
 
 SUPPORTED SECTION TYPES:
headline, text, image, image_with_text, gallery, video, collection, about_me, sliding_banner, divider, testimonials, faq, newsletter, slideshow, basic_list, featured_product, logo_list, contact_us, footer, card_slideshow, banner_slideshow

AVAILABLE VISUAL EFFECTS (use liberally for premium/glossy/modern requests):
- colorScheme: 'white' | 'light' | 'dark' | 'black' | 'highlight'
- showBackground: true with containerBackgroundColor for glassmorphism
- borderStyle: 'none' | 'solid' | 'dashed'
- borderColor: any hex color for accent borders
- animation: 'fade-in' | 'slide-up' | 'slide-left' | 'slide-right' | 'scale-up' | 'blur-in'
- backgroundOverlay: 0-100 for dramatic image overlays
- textShadow: 'none' | 'soft' | 'medium' | 'strong' | 'glow'
- fonts: 'default' | 'serif' | 'mono' | 'display' | 'handwritten' | 'condensed'
 
 OUTPUT FORMAT (STRICT JSON ONLY):
 {
   "layout_plan": [
     { "action": "add|remove|move|refine|ensure", "type": "<section_type>", "targetId": "<optional>", "notes": "<short>" }
   ],
   "theme_plan": { 
     "tone": "light|dark|black|white|highlight", 
     "accent": "#hex", 
     "radius": <number>, 
     "spacing": "compact|balanced|roomy"
    "effects": ["glassmorphism", "gradients", "glows", "borders", "shadows"]
   },
   "copy_plan": { 
     "headline": "max 60 chars", 
     "subhead": "max 120 chars", 
     "cta": "max 20 chars", 
     "voice": "confident|playful|minimal|bold|professional" 
   },
   "asset_plan": [
     { "kind": "image|icon_set|video_loop", "slot": "header.banner|header.avatar|section.bg|section.image|product.thumbnail", "count": <optional>, "aspect": "16:9|1:1|21:9|4:3", "style": "description", "negative": "what to avoid" }
   ],
   "quality_checks": ["no clutter", "consistent spacing", "header shell untouched"]
 }
 
 QUALITY RULES:
 - Hero first, CTA visible early.
 - Keep spacing consistent; use a single radius and shadow style.
 - Limit bento grids to 3-6 items.
 - Limit FAQs to 4-6 items.
 - Use BrandProfile palette unless intent explicitly changes it.
- Maintain accessibility contrast.

DRAMATIC TRANSFORMATION EXAMPLES:
- "Make it premium": Use glassmorphism, add subtle borders, serif fonts, fade-in animations, dark color scheme
- "Make it glossy": Add background overlays, glow text shadows, scale-up animations, highlight color scheme
- "Make it modern": Clean sans fonts, slide-up animations, black color scheme, generous spacing
- "Make it bold": Display fonts, strong text shadows, large headlines, vibrant accents`;
 
 const OPS_GENERATOR_PROMPT = `You are SellsPay's Ops Generator.
 
 Your job is to turn a PLAN into valid patch operations for a storefront.
 
 You will receive:
 - A detailed PLAN (layout_plan, theme_plan, copy_plan, asset_plan)
 - Current layout JSON (all existing sections)
 - Section schemas (allowed fields per type)
 
 Your job: Convert the plan into valid patch operations.
 
 ABSOLUTE RULES:
 - NEVER output raw HTML, CSS, or JavaScript.
 - NEVER inject scripts, iframes, trackers, or event handlers.
 - NEVER modify billing, payouts, auth, or account settings.
 - NEVER break the locked header shell.
 - NEVER mention presets, templates, or internal generators.
- Maximum 6 addSection operations per response (for fresh builds).
- Use clearAllSections operation FIRST when user asks to "build from scratch" or wants a complete redesign.
 - Always include complete content with real, compelling copy.
 - NEVER leave content fields empty.
- USE style_options AGGRESSIVELY to achieve dramatic visual effects.

STYLE OPTIONS YOU MUST USE FOR DRAMATIC CHANGES:
For "premium", "glossy", "luxe", "modern" requests, ALWAYS modify style_options with:
- showBackground: true (enables container background)
- containerBackgroundColor: "rgba(0,0,0,0.3)" or similar for glassmorphism
- borderStyle: "solid" (adds visible border)
- borderColor: "#hex" (use brand accent or gold/silver for luxe)
- animation: "fade-in" | "slide-up" | "scale-up" | "blur-in"
- colorScheme: "dark" or "black" for premium looks
- backgroundOverlay: 20-60 for dramatic image sections

For text/headline sections, ALSO include in content:
- font: "serif" | "display" for premium looks
- textShadow: "soft" | "glow" for glossy effects
- fontWeight: "bold" | "extrabold"
- letterSpacing: "wide" | "wider"
 
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
 
 gallery:
  content: { images: Array of { url: string, altText?: string }, columns: 2|3|4, layout?: "grid"|"masonry" }
  style_options: { colorScheme, sectionHeight, showBackground, containerBackgroundColor, borderStyle, borderColor, animation }

sliding_banner:
  content: { text: string, speed: "slow"|"medium"|"fast", backgroundColor?: string, textColor?: string, font?: string, fontWeight?: string }
  style_options: { colorScheme, sectionHeight }
 
 OUTPUT FORMAT (STRICT):
 Return ONLY the apply_storefront_changes tool call with:
 - message: Brief explanation (max 100 chars)
 - ops: Array of patch operations (max 4 addSection ops)
 - asset_requests: Array of asset generation requests
 - preview_notes: Optional UX hints`;
 
 const REPAIR_PROMPT = `Your patch operations failed validation.
 
 Validation errors:
 {ERRORS}
 
 Rules:
 - Return corrected JSON with message + ops + asset_requests only.
 - Do not change the user's intent.
 - Do not introduce unsupported section types.
 - Keep the header shell locked.
 - Make the smallest changes necessary to become valid.
 - Ensure all content fields have actual content, not empty strings.
 - Respect character limits in schemas.`;
 
 // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 // VALIDATION & HEURISTICS
 // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 
 const VALID_SECTION_TYPES = new Set([
   "headline", "text", "image", "image_with_text", "gallery", "video", 
   "collection", "about_me", "sliding_banner", "divider", "testimonials", 
   "faq", "newsletter", "slideshow", "basic_list", "featured_product", 
   "logo_list", "contact_us", "footer", "card_slideshow", "banner_slideshow"
 ]);
 
 const VALID_OPS = new Set([
  "addSection", "removeSection", "moveSection", "updateSection", 
  "updateTheme", "updateHeaderContent", "assignAssetToSlot", "clearAllSections"
 ]);
 
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
   layoutSummary: string
 ): Promise<any> {
   const userMessage = `User prompt: "${userPrompt}"
 
 Brand profile: ${JSON.stringify(brandProfile || {})}
 
 Current layout: ${layoutSummary}
 
 Extract the user's intent as structured JSON.`;
 
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
       vibe: ["premium", "clean"],
       must_have: [],
       avoid: [],
       target_scope: "entire_storefront",
       assets_needed: [],
       brand_constraints: { palette_locked: true, font_locked: true }
     };
   }
   
   return intent;
 }
 
 async function createPlan(
   apiKey: string,
   intent: any,
   sections: any[],
   brandProfile: any,
   products: any[]
 ): Promise<any> {
   const layoutSummary = sections.map(s => `- ${s.section_type}: ${s.id}`).join("\n") || "No sections yet";
   const productSummary = products?.slice(0, 5).map(p => p.name).join(", ") || "No products";
   
   const userMessage = `User Intent:
 ${JSON.stringify(intent, null, 2)}
 
 Current Layout:
 ${layoutSummary}
 
 Brand Profile:
 ${JSON.stringify(brandProfile || {}, null, 2)}
 
 Products (sample):
 ${productSummary}
 
 Create a detailed plan to achieve this intent.`;
 
   const data = await callAI(apiKey, {
     model: "google/gemini-3-flash-preview",
     systemPrompt: PLANNER_PROMPT,
     userMessage,
     temperature: 0.35,
     maxTokens: 1200,
   });
   
   const plan = extractJSONFromResponse(data);
   
   if (!plan) {
     return {
       layout_plan: [{ action: "add", type: "headline", notes: "Hero section based on user prompt" }],
       theme_plan: { tone: "dark", spacing: "balanced" },
       copy_plan: { headline: intent.goal || "Welcome", voice: "confident" },
       asset_plan: [],
       quality_checks: ["no clutter", "header shell untouched"]
     };
   }
   
   return plan;
 }
 
 async function generateOps(
   apiKey: string,
   plan: any,
   sections: any[],
   userPrompt: string
 ): Promise<any> {
   const userMessage = `Plan to execute:
 ${JSON.stringify(plan, null, 2)}
 
 Current sections:
 ${JSON.stringify(sections, null, 2)}
 
 Original user request: "${userPrompt}"
 
 Generate the patch operations to implement this plan.`;
 
   const data = await callAI(apiKey, {
     model: "google/gemini-3-flash-preview",
     systemPrompt: OPS_GENERATOR_PROMPT,
     userMessage,
     temperature: 0.15,
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
 
     const layoutSummary = sections.length > 0
       ? sections.map((s: any) => s.section_type).join(", ")
       : "Empty storefront (no sections yet)";
 
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     // STEP A: Extract Intent
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     let intent: any;
     try {
       intent = await extractIntent(LOVABLE_API_KEY, message, brandProfile, layoutSummary);
     } catch (e) {
       console.error("Intent extraction failed:", e);
       intent = {
         goal: message,
         vibe: ["premium"],
         must_have: [],
         avoid: [],
         target_scope: "entire_storefront",
         assets_needed: [],
         brand_constraints: { palette_locked: true, font_locked: true }
       };
     }
 
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     // STEP B: Create Plan
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     let plan: any;
     try {
       plan = await createPlan(LOVABLE_API_KEY, intent, sections, brandProfile, products);
     } catch (e) {
       console.error("Planning failed:", e);
       plan = {
         layout_plan: [{ action: "add", type: "headline", notes: "Fallback hero" }],
         theme_plan: { tone: "dark", spacing: "balanced" },
         copy_plan: { headline: intent.goal || "Welcome", voice: "confident" },
         asset_plan: [],
         quality_checks: []
       };
     }
 
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     // STEP C: Generate Ops
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     let opsResult: any;
     try {
       opsResult = await generateOps(LOVABLE_API_KEY, plan, sections, message);
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
       opsResult = {
         message: "I've added a headline section to get you started.",
         ops: [{
           op: "addSection",
           after: null,
           section: {
             section_type: "headline",
             content: { title: intent.goal || "Welcome", subtitle: "Your storefront awaits" },
             style_options: { colorScheme: "dark", height: "large", textAlign: "center" }
           }
         }],
         asset_requests: [],
         preview_notes: ["Fallback applied due to generation error"]
       };
     }
 
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     // STEP D: Validate & Sanitize
     // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     let validationResult = validateAndSanitizeOps(opsResult?.ops || [], sections);
     let repairAttempts = 0;
 
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
       return new Response(
         JSON.stringify({
           message: "I've set up a foundation for your storefront. Tell me more about your style!",
           ops: [
             {
               op: "addSection",
               after: null,
               section: {
                 section_type: "headline",
                 content: { title: intent?.goal || "Welcome", subtitle: "Describe your vibe and I'll build it." },
                 style_options: { colorScheme: "dark", height: "large", textAlign: "center" }
               }
             }
           ],
           asset_requests: [],
           preview_notes: ["Safe fallback applied due to validation errors"]
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