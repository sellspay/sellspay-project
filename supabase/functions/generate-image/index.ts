import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Model ID → Gemini endpoint mapping (mirrors src/models/imageModels.ts)
const MODEL_MAP: Record<string, string> = {
  // Fast
  "nano-banana-2": "gemini-3.1-flash-image-preview",
  "sdxl-turbo": "gemini-2.5-flash-image",
  "nano-banana": "gemini-2.5-flash-image",
  "flux-2-dev": "gemini-3.1-flash-image-preview",
  // Realistic
  "flux-pro": "gemini-3.1-flash-image-preview",
  "flux-2-pro": "gemini-3-pro-image-preview",
  "photo-real-v2": "gemini-3-pro-image-preview",
  "cinematic-scene": "gemini-3-pro-image-preview",
  "seedream-5.0": "gemini-3-pro-image-preview",
  // Stylized
  "recraft-v3": "gemini-3.1-flash-image-preview",
  "juggernaut-flux": "gemini-3.1-flash-image-preview",
  "editorial-fashion": "gemini-3.1-flash-image-preview",
  "grok-imagine": "gemini-3-pro-image-preview",
  "artlist-original-1.0": "gemini-3.1-flash-image-preview",
  // Anime
  "anime-xl": "gemini-2.5-flash-image",
  "anime-diffusion": "gemini-3.1-flash-image-preview",
  // Product
  "product-shot-pro": "gemini-3-pro-image-preview",
  "nano-banana-pro": "gemini-3-pro-image-preview",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { prompt, model } = await req.json();
    const requestedModel = typeof model === "string" ? model : "nano-banana-2";
    const resolvedModel = MODEL_MAP[requestedModel] ?? MODEL_MAP["nano-banana-2"];

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const BLOCKED_PATTERNS = [
      /\b(kill|murder|slaughter|massacre)\b.*\b(people|children|humans)\b/i,
      /\b(bomb|shoot|stab)\b.*\b(school|church|mosque|synagogue)\b/i,
      /\bhow\s+to\s+(make|build)\s+(bomb|weapon|gun)\b/i,
      /\b(racial\s+superiority|white\s+power|ethnic\s+cleansing)\b/i,
      /\b(death\s+to\s+(?:all|every))\b/i,
      /\b(how\s+to\s+)?(suicide|self.?harm|cut\s+myself)\b/i,
      /\b(nude|naked|porn|hentai|xxx|nsfw|erotic|sexually\s+explicit)\b/i,
      /\b(sex\s+scene|sexual\s+content|adult\s+content)\b/i,
      /\b(deepfake|impersonat)\b/i,
      /\bhow\s+to\s+(make|cook|synthesize)\s+(meth|cocaine|heroin|drugs)\b/i,
    ];

    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(prompt)) {
        return new Response(
          JSON.stringify({
            error: "Content policy violation: your prompt contains prohibited content. Please modify and try again.",
          }),
          {
            status: 422,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    const GOOGLE_GEMINI_API_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!GOOGLE_GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Generating image for user ${user.id} with ${resolvedModel}`);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${resolvedModel}:generateContent?key=${GOOGLE_GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt.trim() }] }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const errorText = await response.text();
      console.error("Image generation error:", response.status, errorText);
      throw new Error("Failed to generate image");
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];

    let imageBase64 = "";
    let mimeType = "image/png";

    for (const part of parts) {
      if (part.inlineData) {
        imageBase64 = part.inlineData.data;
        mimeType = part.inlineData.mimeType || "image/png";
        break;
      }

      if (part.inline_data) {
        imageBase64 = part.inline_data.data;
        mimeType = part.inline_data.mime_type || "image/png";
        break;
      }
    }

    if (!imageBase64) {
      console.error("No image in response:", JSON.stringify(data).substring(0, 500));
      throw new Error("No image generated");
    }

    const imageUrl = `data:${mimeType};base64,${imageBase64}`;

    await supabaseClient.from("tool_usage").insert({
      user_id: user.id,
      tool_id: "image_generator",
    });

    return new Response(
      JSON.stringify({
        success: true,
        image_url: imageUrl,
        requested_model: requestedModel,
        resolved_model: resolvedModel,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating image:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
