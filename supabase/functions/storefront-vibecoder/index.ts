 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 const SYSTEM_PROMPT = `You are SellsPay's Storefront Vibecoder: a chat-based co-pilot that edits a creator's storefront safely.
 
 GOAL
Help users improve their storefront design, layout, copy, and assets. When the user describes what they want, ALWAYS generate the operations to make it happen. Be proactive - don't ask for clarification unless absolutely necessary.
 
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
 5) Every response must be apply-able as a PATCH: return JSON with ops[] matching the tool schema.
 
 WORKING STYLE
- NEVER ask clarifying questions - make the best possible assumption and proceed immediately.
- ALWAYS generate at least one operation for any request - be proactive.
- If the user's request is vague, interpret it generously and create something impressive.
- Prefer bold, visually impactful changes over minimal tweaks.
- When adding sections, include compelling default content that the user can customize later.
- For "make it premium/better" requests: add multiple sections, improve spacing, use better color schemes.
 
 SUPPORTED SECTION TYPES:
 text, image, image_with_text, gallery, video, collection, about_me, headline, sliding_banner, divider, testimonials, faq, newsletter, slideshow, basic_list, featured_product, logo_list, contact_us, footer, card_slideshow, banner_slideshow
 
 COLOR SCHEMES: white, light, dark, black, highlight
 SECTION HEIGHTS: small, medium, large
 BACKGROUND WIDTHS: contained, full
 
EXAMPLES OF PROACTIVE BEHAVIOR:
- "Add a hero" → Add a headline section with impactful text, dark colorScheme, large height
- "Make it premium" → Add headline, update colorScheme to dark on existing sections, add testimonials
- "I want to showcase my work" → Add gallery section with placeholder images
- "Add testimonials" → Add testimonials section with 3 example testimonials

 OUTPUT FORMAT (STRICT)
Return only valid JSON via tool call to "apply_storefront_changes". ALWAYS include at least one operation.
 
 QUALITY BAR
 Edits should look cohesive, aligned, spaced well, readable, and consistent with the brand. Avoid clutter.`;
 
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
         messages: [
           { role: "system", content: SYSTEM_PROMPT },
           { role: "user", content: contextMessage },
         ],
         tools: [
           {
             type: "function",
             function: {
               name: "apply_storefront_changes",
               description: "Apply patch operations to the storefront layout",
               parameters: {
                 type: "object",
                 properties: {
                   message: {
                     type: "string",
                     description: "A brief explanation of the proposed changes for the user",
                   },
                   ops: {
                     type: "array",
                     description: "Array of patch operations to apply",
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
                           properties: {
                             section_type: { type: "string" },
                             content: { type: "object" },
                             style_options: { type: "object" },
                           },
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
     
     // Extract tool call result
     const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
     if (!toolCall || toolCall.function.name !== "apply_storefront_changes") {
       // Fallback: try to parse from content if no tool call
       const content = data.choices?.[0]?.message?.content;
       if (content) {
         return new Response(JSON.stringify({
           message: content,
           ops: [],
         }), {
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         });
       }
       throw new Error("No valid response from AI");
     }
 
     const result = JSON.parse(toolCall.function.arguments);
     
     // Validate operations
     const validatedOps = (result.ops || []).filter((op: { op: string }) => {
       const validOps = ["addSection", "removeSection", "moveSection", "updateSection", "updateTheme", "updateHeaderContent", "assignAssetToSlot"];
       return validOps.includes(op.op);
     });
 
     return new Response(JSON.stringify({
       message: result.message || "Here are my suggestions.",
       ops: validatedOps,
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