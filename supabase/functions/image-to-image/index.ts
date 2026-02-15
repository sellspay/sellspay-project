import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const IMAGE_COST = 10; // credits per image-to-image generation

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ====== AUTH ======
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: { user }, error: authError } = await createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    ).auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { prompt, image_url, mode = "edit" } = await req.json();

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!image_url || typeof image_url !== "string") {
      return new Response(JSON.stringify({ error: "image_url is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ====== CREDIT CHECK & DEDUCT ======
    const { data: wallet } = await supabase
      .from("user_wallets").select("balance").eq("user_id", user.id).single();

    const currentBalance = wallet?.balance ?? 0;
    if (currentBalance < IMAGE_COST) {
      return new Response(JSON.stringify({
        error: "INSUFFICIENT_CREDITS",
        message: `Insufficient credits. You have ${currentBalance}, but this costs ${IMAGE_COST}.`,
        required: IMAGE_COST, available: currentBalance,
      }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: deductSuccess, error: deductError } = await supabase.rpc("deduct_credits", {
      p_user_id: user.id, p_amount: IMAGE_COST, p_action: "image_gen",
    });

    if (deductError || !deductSuccess) {
      return new Response(JSON.stringify({ error: "INSUFFICIENT_CREDITS", message: "Insufficient credits." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ====== FETCH SOURCE IMAGE ======
    const GOOGLE_GEMINI_API_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!GOOGLE_GEMINI_API_KEY) {
      await supabase.rpc("add_credits", { p_user_id: user.id, p_amount: IMAGE_COST, p_action: "refund", p_description: "Refund: GOOGLE_GEMINI_API_KEY not configured" });
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download the source image and convert to base64
    console.log(`Fetching source image for user ${user.id}...`);
    const imageResponse = await fetch(image_url);
    if (!imageResponse.ok) {
      await supabase.rpc("add_credits", { p_user_id: user.id, p_amount: IMAGE_COST, p_action: "refund", p_description: "Refund: failed to fetch source image" });
      throw new Error("Failed to fetch source image");
    }

    const imageBytes = new Uint8Array(await imageResponse.arrayBuffer());
    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";

    // Convert to base64
    let binary = "";
    for (let i = 0; i < imageBytes.length; i++) {
      binary += String.fromCharCode(imageBytes[i]);
    }
    const base64Image = btoa(binary);

    // Build mode-specific system instruction
    const modeInstructions: Record<string, string> = {
      edit: "Edit this image according to the user's instructions. Maintain the overall composition and style unless told otherwise.",
      enhance: "Enhance this image: improve quality, lighting, colors, and sharpness while preserving the original content.",
      style_transfer: "Apply the described artistic style to this image while preserving its core subject and composition.",
      remove_bg: "Remove the background from this image, keeping only the main subject on a transparent or white background.",
      upscale: "Upscale and enhance this image to higher quality and resolution while preserving details.",
    };

    const systemInstruction = modeInstructions[mode] || modeInstructions.edit;
    const fullPrompt = `${systemInstruction}\n\nUser request: ${prompt.trim()}`;

    console.log(`Image-to-image (${mode}) for user ${user.id}: "${prompt.substring(0, 50)}..."`);

    // ====== GEMINI IMAGE GENERATION ======
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: fullPrompt },
                {
                  inline_data: {
                    mime_type: contentType,
                    data: base64Image,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini error:", response.status, errorText);

      await supabase.rpc("add_credits", {
        p_user_id: user.id, p_amount: IMAGE_COST, p_action: "refund",
        p_description: `Refund: image-to-image failed (${response.status})`,
      });

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Image generation failed: ${response.status}`);
    }

    const data = await response.json();

    // Extract generated image from Gemini response
    let outputImageBase64 = "";
    let outputMimeType = "image/png";

    const parts = data.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        outputImageBase64 = part.inlineData.data;
        outputMimeType = part.inlineData.mimeType || "image/png";
        break;
      }
      if (part.inline_data) {
        outputImageBase64 = part.inline_data.data;
        outputMimeType = part.inline_data.mime_type || "image/png";
        break;
      }
    }

    if (!outputImageBase64) {
      console.error("No image in Gemini response:", JSON.stringify(data).substring(0, 500));
      await supabase.rpc("add_credits", {
        p_user_id: user.id, p_amount: IMAGE_COST, p_action: "refund",
        p_description: "Refund: no image in response",
      });
      throw new Error("No image generated");
    }

    // Track usage
    await supabase.from("tool_usage").insert({ user_id: user.id, tool_id: "image_to_image" });

    // Get updated balance
    const { data: newWallet } = await supabase
      .from("user_wallets").select("balance").eq("user_id", user.id).single();

    return new Response(JSON.stringify({
      success: true,
      image_base64: outputImageBase64,
      mime_type: outputMimeType,
      mode,
      credits_deducted: IMAGE_COST,
      remaining_credits: newWallet?.balance ?? 0,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Image-to-image error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
