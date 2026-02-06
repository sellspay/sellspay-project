import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Credit costs for different model types (must match frontend)
// Updated Fair Pricing: 8x reduction to match actual API costs
const MODEL_COSTS: Record<string, number> = {
  'nano-banana': 10,     // Was 100 - Image gen
  'flux-pro': 10,        // Was 100 - Image gen
  'recraft-v3': 10,      // Was 100 - Image gen
  'luma-ray-2': 50,      // Was 500 - Video gen
  'kling-video': 50,     // Was 500 - Video gen
};

// Map model IDs to Lovable AI models
const MODEL_MAP: Record<string, string> = {
  'nano-banana': 'google/gemini-2.5-flash-image',
  'flux-pro': 'google/gemini-2.5-flash-image', // Use Nano banana for now
  'recraft-v3': 'google/gemini-2.5-flash-image',
  'luma-ray-2': 'google/gemini-2.5-flash-image', // Placeholder
  'kling-video': 'google/gemini-2.5-flash-image', // Placeholder
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profileId, type, prompt, spec, model = 'nano-banana' } = await req.json();
    
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

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    const cost = MODEL_COSTS[model] || 100;

    // ============================================
    // CREDIT ENFORCEMENT: Check and deduct credits
    // ============================================
    
    // Get current balance
    const { data: wallet, error: walletError } = await supabase
      .from('user_wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (walletError && walletError.code !== 'PGRST116') {
      console.error("Wallet fetch error:", walletError);
      throw new Error("Failed to check credit balance");
    }

    const currentBalance = wallet?.balance ?? 0;

    if (currentBalance < cost) {
      return new Response(JSON.stringify({ 
        error: "INSUFFICIENT_CREDITS",
        message: `Insufficient credits. You have ${currentBalance}, but this costs ${cost}.`,
        required: cost,
        available: currentBalance
      }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Deduct credits using the secure RPC function
    const action = model.includes('video') || model.includes('luma') || model.includes('kling') 
      ? 'video_gen' 
      : 'image_gen';
    
    const { data: deductSuccess, error: deductError } = await supabase
      .rpc('deduct_credits', {
        p_user_id: userId,
        p_amount: cost,
        p_action: action
      });

    if (deductError) {
      console.error("Credit deduction error:", deductError);
      throw new Error("Failed to deduct credits");
    }

    if (!deductSuccess) {
      return new Response(JSON.stringify({ 
        error: "INSUFFICIENT_CREDITS",
        message: "Insufficient credits for this generation."
      }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ============================================
    // GENERATE ASSET
    // ============================================

    // Build image generation prompt
    const aspectRatio = type === 'banner' ? '21:9' : '1:1';
    const styleHints = spec?.style ? `, ${spec.style} style` : '';
    const paletteHints = spec?.palette?.length ? `, using colors: ${spec.palette.join(', ')}` : '';
    const fullPrompt = `${prompt}${styleHints}${paletteHints}. Professional, high quality, ${aspectRatio} aspect ratio.`;

    const aiModel = MODEL_MAP[model] || 'google/gemini-2.5-flash-image';

    // Generate image using Lovable AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          { role: "user", content: fullPrompt },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      // Refund credits if generation fails
      await supabase.rpc('add_credits', {
        p_user_id: userId,
        p_amount: cost,
        p_action: 'refund',
        p_description: `Refund for failed ${action}`
      });

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Image generation failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract image URL from response
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageUrl) {
      // Refund credits if no image generated
      await supabase.rpc('add_credits', {
        p_user_id: userId,
        p_amount: cost,
        p_action: 'refund',
        p_description: `Refund for failed ${action} - no image generated`
      });

      const textContent = data.choices?.[0]?.message?.content;
      console.error("Image generation response:", JSON.stringify(data));
      throw new Error(textContent || "No image generated");
    }

    // Save to database
    const { data: asset, error: insertError } = await supabase
      .from('storefront_generated_assets')
      .insert({
        profile_id: profileId,
        asset_url: imageUrl,
        asset_type: type,
        prompt: prompt,
        spec: { ...spec, model },
        status: 'draft',
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // Get new balance
    const { data: newWallet } = await supabase
      .from('user_wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();

    return new Response(JSON.stringify({
      id: asset.id,
      url: asset.asset_url,
      type: asset.asset_type,
      credits_deducted: cost,
      remaining_credits: newWallet?.balance ?? 0,
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
