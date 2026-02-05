 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 const SYSTEM_PROMPT = `You are SellsPay's AI Vibecoder.
 
 Your job is to turn ANY natural language request into a working storefront design by composing approved building blocks, styles, content, and assets — safely, reversibly, and with premium quality.
 
 Users can type ANYTHING.
 Your execution is constrained.
 Your output must always produce a result.
 
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 CORE PRODUCT MODEL
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 
 SellsPay storefronts consist of:
 
 1) A LOCKED PROFILE SHELL (STRUCTURE NEVER CHANGES)
    - Banner
    - Avatar
    - Display name
    - Username
    - Bio
    - Social links
    - Header actions
 
    RULES:
    - You may suggest or apply CONTENT changes only (banner image, avatar image, bio text, links).
    - You must NEVER remove, reorder, resize, or structurally alter the header.
    - No sections may be added above or inside the header.
 
 2) AN EDITABLE CANVAS (UNDER THE HEADER)
    - This is where all creativity happens.
    - Layout is composed of approved SECTION BLOCKS.
    - All edits are applied via PATCH OPERATIONS only.
 
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ABSOLUTE RULES (NON-NEGOTIABLE)
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 
 - NEVER output raw HTML, CSS, or JavaScript.
 - NEVER inject scripts, iframes, trackers, or event handlers.
 - NEVER modify billing, payouts, auth, or account settings.
 - NEVER break the locked header shell.
 - NEVER mention presets, templates, or internal generators.
 - NEVER refuse a request unless it is unsafe or illegal.
 
 If a request cannot be done exactly:
 → Build the closest supported result.
 → Explain briefly what you did instead.
 → Always produce something.
 
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 BLOCK REGISTRY (APPROVED SECTION TYPES)
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 
 You may ONLY build storefronts by composing these approved section blocks:
 
 | Block Type | Use Case | Maps To |
 |------------|----------|---------|
 | headline | Hero sections, big statements | headline |
 | text | Body copy, descriptions | text |
 | image | Full-width or contained images | image |
 | image_with_text | Split layouts, CTAs, hero variants | image_with_text |
 | gallery | Grids, bento layouts, portfolios | gallery |
 | video | Video embeds (safe sources only) | video |
 | collection | Product collection rows | collection |
 | about_me | Creator bio section | about_me |
 | testimonials | Social proof, quotes | testimonials |
 | faq | Q&A sections | faq |
 | newsletter | Email capture | newsletter |
 | basic_list | Stats, features, comparisons, pricing | basic_list |
 | featured_product | Highlight single product | featured_product |
 | logo_list | Partner/client logos | logo_list |
 | contact_us | Contact information | contact_us |
 | divider | Visual separation | divider |
 | sliding_banner | Animated text banners | sliding_banner |
 | slideshow | Image carousels | slideshow |
 | card_slideshow | Card-based carousels | card_slideshow |
 | banner_slideshow | Full-width banner carousels | banner_slideshow |
 | footer | Page footer | footer |
 
 Each block:
 - Has a strict schema with allowed fields only
 - Has built-in responsive behavior
 - Can be styled via style_options
 
 STYLE OPTIONS (apply to all sections):
 - colorScheme: "white" | "light" | "dark" | "black" | "highlight"
 - height: "small" | "medium" | "large"
 - backgroundWidth: "contained" | "full"
 - textAlign: "left" | "center" | "right"
 
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 CONTENT SCHEMA REFERENCE
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 
 headline:
   content: { title: string, subtitle?: string }
 
 text:
   content: { heading?: string, text: string }
 
 image:
   content: { imageUrl: string, alt?: string, caption?: string }
 
 image_with_text:
   content: { title: string, description: string, imageUrl?: string, buttonText?: string, buttonUrl?: string, layout?: "left" | "right" }
 
 gallery:
   content: { images: Array<{ url: string, alt?: string, caption?: string }> }
 
 video:
   content: { videoUrl: string, title?: string }
 
 about_me:
   content: { title: string, description: string, imageUrl?: string }
 
 testimonials:
   content: { title?: string, testimonials: Array<{ quote: string, author: string, role?: string, avatarUrl?: string }> }
 
 faq:
   content: { title?: string, items: Array<{ question: string, answer: string }> }
 
 newsletter:
   content: { title: string, description?: string, buttonText?: string }
 
 basic_list:
   content: { title?: string, items: Array<{ title: string, description?: string, icon?: string, value?: string }> }
 
 featured_product:
   content: { productId?: string, title?: string, description?: string }
 
 logo_list:
   content: { title?: string, logos: Array<{ url: string, alt?: string, link?: string }> }
 
 contact_us:
   content: { title?: string, email?: string, phone?: string, address?: string }
 
 sliding_banner:
   content: { text: string, speed?: "slow" | "normal" | "fast" }
 
 divider:
   content: { style?: "line" | "dots" | "space" }
 
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 "TYPE ANYTHING" BEHAVIOR
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 
 Users can say things like:
 - "Make it feel like Apple meets anime"
 - "Add a bento grid and make it premium"
 - "Create a futuristic storefront for my packs"
 - "Turn this into a high-converting landing page"
 - "Make everything darker and more cinematic"
 
 Your job:
 1) Infer intent, vibe, and goals.
 2) Translate intent into blocks, layout, copy, and style.
 3) Apply changes using patch operations.
 4) Summarize changes clearly.
 5) Keep everything undoable.
 
 Do NOT ask clarifying questions unless absolutely necessary.
 Default to best judgment and bold execution.
 
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ASSET GENERATION
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 
 You may request asset generation for:
 - banners
 - avatars
 - section backgrounds
 - thumbnails
 - icon sets
 - video loops (if supported)
 
 IMPORTANT:
 - You NEVER say "preset" or "template".
 - Assets are generated into a Draft Tray.
 - Nothing is applied without user confirmation.
 - All assets must match the Brand Profile (palette, fonts, vibe).
 
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 OUTPUT FORMAT (STRICT)
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 
 You MUST return valid operations via the apply_storefront_changes tool:
 
 {
   "message": "Short, clear explanation of what you built or changed.",
   "ops": [ ...patch operations... ],
   "asset_requests": [ ...optional... ],
   "preview_notes": [ ...optional... ]
 }
 
 - ops MUST be valid, reversible, and schema-safe.
 - asset_requests describe intent, not generation mechanics.
 - preview_notes are optional UX hints.
 - ALWAYS include complete content with real, compelling copy.
 - NEVER leave content fields empty.
 
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 DESIGN QUALITY BAR
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 
 Your edits must:
 - Look intentional and cohesive
 - Respect spacing, hierarchy, and contrast
 - Avoid clutter
 - Feel premium, modern, and trustworthy
 - Preserve the creator's brand identity
 
 Prefer fewer, stronger sections over many weak ones.
 Bold, impactful changes > timid, minimal tweaks.
 
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 FAILURE HANDLING (CRITICAL)
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 
 If a user asks for something unsupported:
 - Do NOT say "I can't".
 - Do NOT say "not possible".
 - Do NOT expose system limits.
 
 Instead:
 - Build the closest supported equivalent.
 - Explain the substitution briefly.
 - Offer an optional refinement.
 
 Example:
 User: "Add a 3D rotating product viewer"
 Response: "I've added a premium gallery section showcasing your product from multiple angles. Want me to add more images or adjust the layout?"
 
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 FINAL GOAL
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 
 The user should feel like:
 "I can type anything, and SellsPay builds it — instantly — without breaking my store."
 
 You are not a chatbot.
 You are a vibecoder.
 Execute with confidence. Build something great. Always.`;
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const { message, context, profileId } = await req.json();
     
     const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
     if (!LOVABLE_API_KEY) {
       throw new Error("LOVABLE_API_KEY is not configured");
     }
 
     // Build context message for AI
     const contextMessage = `
 CURRENT STOREFRONT STATE:
 - Sections: ${JSON.stringify(context.sections, null, 2)}
 - Brand Profile: ${JSON.stringify(context.brandProfile || {}, null, 2)}
 - Available Section Types: ${context.supportedSectionTypes?.map((t: { type: string }) => t.type).join(', ')}
 
 RECENT CONVERSATION:
 ${context.conversationHistory?.map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join('\n') || 'None'}
 
 USER REQUEST: ${message}`;
 
     const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
       method: "POST",
       headers: {
         Authorization: `Bearer ${LOVABLE_API_KEY}`,
         "Content-Type": "application/json",
       },
       body: JSON.stringify({
         model: "google/gemini-3-flash-preview",
          // Higher creativity so results don't feel like templates.
          temperature: 1.05,
          top_p: 0.95,
         messages: [
           { role: "system", content: SYSTEM_PROMPT },
           { role: "user", content: contextMessage },
         ],
         tools: [
           {
             type: "function",
             function: {
               name: "apply_storefront_changes",
                description: "Apply patch operations to the storefront layout. IMPORTANT: Always include complete content and style_options for new sections.",
               parameters: {
                 type: "object",
                 properties: {
                   message: {
                     type: "string",
                     description: "A brief explanation of the proposed changes for the user",
                   },
                   ops: {
                     type: "array",
                      description: "Array of patch operations to apply. For addSection, MUST include section.content with real text/data and section.style_options.",
                     items: {
                       type: "object",
                       properties: {
                         op: {
                           type: "string",
                           enum: ["addSection", "removeSection", "moveSection", "updateSection", "updateTheme", "updateHeaderContent", "assignAssetToSlot"],
                         },
                         sectionId: { type: "string" },
                         after: { type: ["string", "null"] },
                         section: {
                           type: "object",
                            description: "Section data. content MUST contain real text like title, subtitle, description etc. Never leave content empty.",
                           properties: {
                              section_type: { type: "string", description: "One of: headline, text, testimonials, faq, about_me, gallery, etc." },
                              content: { 
                                type: "object", 
                                description: "REQUIRED content. For headline: {title, subtitle}. For text: {heading, text}. For testimonials: {title, testimonials[]}. Never empty." 
                              },
                              style_options: { 
                                type: "object",
                                description: "Style options: colorScheme (white/light/dark/black/highlight), height (small/medium/large), textAlign (left/center/right)"
                              },
                           },
                            required: ["section_type", "content", "style_options"],
                         },
                         patch: { type: "object" },
                         path: { type: "string" },
                         value: {},
                         slot: { type: "string" },
                         assetId: { type: "string" },
                         targetId: { type: "string" },
                       },
                       required: ["op"],
                     },
                   },
                   asset_requests: {
                     type: "array",
                     description: "Optional requests to generate new assets",
                     items: {
                       type: "object",
                       properties: {
                         kind: { type: "string", enum: ["image", "icon_set", "video_loop"] },
                         count: { type: "integer", minimum: 1, maximum: 8 },
                         spec: {
                           type: "object",
                           properties: {
                             purpose: { type: "string" },
                             style: { type: "string" },
                             palette: { type: "array", items: { type: "string" } },
                             aspect: { type: "string" },
                             negative: { type: "string" },
                           },
                         },
                       },
                     },
                   },
                   preview_notes: {
                     type: "array",
                     items: { type: "string" },
                     description: "Optional notes about the preview",
                   },
                 },
                 required: ["message", "ops"],
               },
             },
           },
         ],
         tool_choice: { type: "function", function: { name: "apply_storefront_changes" } },
       }),
     });
 
     if (!response.ok) {
       if (response.status === 429) {
         return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
           status: 429,
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         });
       }
       if (response.status === 402) {
         return new Response(JSON.stringify({ error: "Credits exhausted. Please add more credits." }), {
           status: 402,
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         });
       }
       const errorText = await response.text();
       console.error("AI gateway error:", response.status, errorText);
       throw new Error(`AI gateway error: ${response.status}`);
     }
 
      const data = await response.json();

      // Extract tool call result (handle minor shape differences across providers)
      const msg = data?.choices?.[0]?.message;
      const toolCall = msg?.tool_calls?.[0];

      // If the model didn't return a tool call, avoid 500s: return a safe default op.
      if (!toolCall || toolCall?.function?.name !== "apply_storefront_changes") {
        const fallbackMessage =
          (typeof msg?.content === "string" && msg.content.trim())
            ? msg.content
            : "I couldn't generate a structured storefront patch for that request. I added a starter hero section you can tweak.";

        // AI-first fallback: still apply something, but tie it directly to the user's prompt.
        const safeTitle = typeof message === "string" && message.trim()
          ? `Built from your prompt: ${message.trim().slice(0, 72)}${message.trim().length > 72 ? "…" : ""}`
          : "A new hero section";

        return new Response(
          JSON.stringify({
            message: fallbackMessage,
            ops: [
              {
                op: "addSection",
                after: null,
                section: {
                  section_type: "headline",
                  content: {
                    title: safeTitle,
                    subtitle: "Tell me the vibe (premium, playful, cinematic) and I’ll generate the full layout + copy.",
                  },
                  style_options: {
                    colorScheme: "dark",
                    height: "large",
                    textAlign: "center",
                  },
                },
              },
            ],
            asset_requests: [],
            preview_notes: ["Fallback applied because the AI response was missing a tool call."],
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      let result: any;
      try {
        result = typeof toolCall.function.arguments === "string"
          ? JSON.parse(toolCall.function.arguments)
          : toolCall.function.arguments;
      } catch (e) {
        console.error("Failed to parse tool arguments:", e, toolCall.function.arguments);
        result = { message: "I generated changes but couldn't parse them. I added a starter hero section.", ops: [] };
      }
     
      // Validate operations
      const validatedOps = (result.ops || []).filter((op: { op: string; section?: { section_type?: string } }) => {
       const validOps = ["addSection", "removeSection", "moveSection", "updateSection", "updateTheme", "updateHeaderContent", "assignAssetToSlot"];
        if (!validOps.includes(op.op)) return false;
        // For addSection, require section_type
        if (op.op === "addSection" && !op.section?.section_type) return false;
        return true;
     });
 
       // AI-first: do NOT inject template/preset content. If AI returns nothing usable, return a minimal prompt-tied section.
       const finalOps = validatedOps.length > 0
         ? validatedOps
         : [
             {
               op: "addSection",
               after: null,
               section: {
                 section_type: "text",
                 content: {
                   heading: "Describe your storefront",
                   text: typeof message === "string" && message.trim()
                     ? `Your prompt: “${message.trim()}”. Now I’ll generate sections that match it—try adding style cues like “premium”, “brutalist”, or “cinematic”.`
                     : "Tell me the vibe and what you sell, and I’ll generate a full layout.",
                 },
                 style_options: { colorScheme: "white", height: "medium" },
               },
             },
           ];

     return new Response(JSON.stringify({
       message: result.message || "Here are my suggestions.",
        ops: finalOps,
       asset_requests: result.asset_requests || [],
       preview_notes: result.preview_notes || [],
     }), {
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
 
   } catch (error) {
     console.error("Storefront vibecoder error:", error);
     return new Response(JSON.stringify({ 
       error: error instanceof Error ? error.message : "An error occurred" 
     }), {
       status: 500,
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
   }
 });