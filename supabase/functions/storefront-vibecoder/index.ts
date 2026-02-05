 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
  const SYSTEM_PROMPT = `You are SellsPay's Storefront Vibecoder: a chat-based co-pilot that edits a creator's storefront safely.
 
GOAL:
Help users improve their storefront design, layout, copy, and assets. When the user describes what they want, ALWAYS generate the operations to make it happen. Be proactive - don't ask for clarification unless absolutely necessary.
 
HARD CONSTRAINTS:
1) Profile Shell is LOCKED structurally:
    - Banner area + avatar + profile header layout must never be removed, reordered, or structurally changed.
    - You may propose content changes to banner image, avatar image, display name, bio, and social links ONLY via allowed header ops.
 2) You must edit the storefront using patch operations only.
3) Only use section types from the SUPPORTED list below.
 
WORKING STYLE:
- NEVER ask clarifying questions - make the best possible assumption and proceed immediately.
- ALWAYS generate at least one operation for any request - be proactive.
- If the user's request is vague, interpret it generously and create something impressive.
- Prefer bold, visually impactful changes over minimal tweaks.
- ALWAYS include real, compelling content in sections - NEVER leave content empty.
- For "make it premium/better" requests: add multiple sections, improve spacing, use better color schemes.
 
 SUPPORTED SECTION TYPES:
headline, text, image, image_with_text, gallery, video, collection, about_me, sliding_banner, divider, testimonials, faq, newsletter, slideshow, basic_list, featured_product, logo_list, contact_us, footer, card_slideshow, banner_slideshow
 
STYLE OPTIONS:
- colorScheme: "white" | "light" | "dark" | "black" | "highlight"
- height: "small" | "medium" | "large"
- backgroundWidth: "contained" | "full"
- textAlign: "left" | "center" | "right"
 
CRITICAL - CONTENT EXAMPLES (always include content like this):

For "headline" section:
content: { "title": "Welcome to My Creative Studio", "subtitle": "Premium digital assets crafted with passion" }
style_options: { "colorScheme": "dark", "height": "large", "textAlign": "center" }
 
For "text" section:
content: { "text": "I create high-quality assets for creators...", "heading": "About My Work" }
style_options: { "colorScheme": "white", "height": "medium" }

For "testimonials" section:
content: { "title": "What Creators Say", "testimonials": [{"quote": "Amazing quality!", "author": "Alex M.", "role": "Editor"}, {"quote": "Best investment!", "author": "Sam K.", "role": "Creator"}] }
style_options: { "colorScheme": "light", "height": "medium" }

For "faq" section:
content: { "title": "FAQ", "items": [{"question": "What formats?", "answer": "Industry-standard formats."}, {"question": "Commercial use?", "answer": "Yes, full license included."}] }

For "about_me" section:
content: { "title": "About Me", "description": "I'm a passionate creator specializing in...", "imageUrl": "" }

 IMPORTANT: The examples above are ONLY structural guidance. Do NOT reuse their wording. Always generate fresh, specific, prompt-aligned copy.

 OUTPUT: Always use the apply_storefront_changes tool with complete content.`;
 
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