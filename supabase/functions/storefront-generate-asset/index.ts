 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const { profileId, type, prompt, spec } = await req.json();
     
     const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
     const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
     const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
     
     if (!LOVABLE_API_KEY) {
       throw new Error("LOVABLE_API_KEY is not configured");
     }
     if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
       throw new Error("Supabase configuration missing");
     }
 
     const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
 
     // Build image generation prompt
     const aspectRatio = type === 'banner' ? '21:9' : '1:1';
     const styleHints = spec?.style ? `, ${spec.style} style` : '';
     const paletteHints = spec?.palette?.length ? `, using colors: ${spec.palette.join(', ')}` : '';
     const fullPrompt = `${prompt}${styleHints}${paletteHints}. Professional, high quality, ${aspectRatio} aspect ratio.`;
 
     // Generate image using Lovable AI
     const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
       method: "POST",
       headers: {
         Authorization: `Bearer ${LOVABLE_API_KEY}`,
         "Content-Type": "application/json",
       },
       body: JSON.stringify({
         model: "google/gemini-2.5-flash-image",
         messages: [
           { role: "user", content: fullPrompt },
         ],
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
       throw new Error(`Image generation failed: ${response.status}`);
     }
 
     const data = await response.json();
     
     // Extract image URL from response
     const imageUrl = data.choices?.[0]?.message?.content;
     if (!imageUrl) {
       throw new Error("No image generated");
     }
 
     // Save to database
     const { data: asset, error: insertError } = await supabase
       .from('storefront_generated_assets')
       .insert({
         profile_id: profileId,
         asset_url: imageUrl,
         asset_type: type,
         prompt: prompt,
         spec: spec || {},
         status: 'draft',
       })
       .select()
       .single();
 
     if (insertError) {
       throw insertError;
     }
 
     return new Response(JSON.stringify({
       id: asset.id,
       url: asset.asset_url,
       type: asset.asset_type,
     }), {
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
 
   } catch (error) {
     console.error("Asset generation error:", error);
     return new Response(JSON.stringify({ 
       error: error instanceof Error ? error.message : "An error occurred" 
     }), {
       status: 500,
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
   }
 });