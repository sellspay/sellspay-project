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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    const { frames, style, aspectRatio, productName } = await req.json();

    if (!frames?.length) {
      return new Response(JSON.stringify({ error: "No frames provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ====== CONTENT MODERATION (check each frame description) ======
    const BLOCKED_PATTERNS = [
      /\b(kill|murder|slaughter|massacre)\b.*\b(people|children|humans)\b/i,
      /\b(bomb|shoot|stab)\b.*\b(school|church|mosque|synagogue)\b/i,
      /\b(nude|naked|porn|hentai|xxx|nsfw|erotic|sexually\s+explicit)\b/i,
      /\b(deepfake|impersonat)\b/i,
      /\bhow\s+to\s+(make|cook|synthesize)\s+(meth|cocaine|heroin|drugs)\b/i,
    ];

    for (const frame of frames) {
      const desc = frame.visual_description || "";
      for (const pattern of BLOCKED_PATTERNS) {
        if (pattern.test(desc)) {
          console.warn(`Blocked video frame from user ${userId}: policy violation in frame ${frame.frame_number}`);
          return new Response(JSON.stringify({
            error: `Content policy violation in frame ${frame.frame_number}. Please modify the description and try again.`,
          }), {
            status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    // Cost: 10 credits per frame image
    const totalCost = frames.length * 10;

    // Check balance
    const { data: wallet } = await supabase
      .from("user_wallets")
      .select("balance")
      .eq("user_id", userId)
      .single();

    if ((wallet?.balance ?? 0) < totalCost) {
      return new Response(JSON.stringify({
        error: "INSUFFICIENT_CREDITS",
        required: totalCost,
        available: wallet?.balance ?? 0,
      }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate images for each frame sequentially
    const generatedFrames: Array<{ frame_number: number; image_url: string }> = [];

    for (const frame of frames) {
      const styleHint = style ? `${style} cinematic style, ` : "";
      const prompt = `${styleHint}product promo frame for "${productName || "product"}": ${frame.visual_description}. ${frame.text_overlay ? `Text overlay: "${frame.text_overlay}". ` : ""}Professional, high quality, ${aspectRatio || "9:16"} aspect ratio. No text in the image unless specified.`;

      const response = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            messages: [{ role: "user", content: prompt }],
            modalities: ["image", "text"],
          }),
        }
      );

      if (!response.ok) {
        console.error(`Frame ${frame.frame_number} generation failed: ${response.status}`);
        // Refund remaining credits and stop
        const creditsUsed = generatedFrames.length * 10;
        if (creditsUsed > 0) {
          await supabase.rpc("deduct_credits", {
            p_user_id: userId,
            p_amount: creditsUsed,
            p_action: "video_frames",
          });
        }
        return new Response(JSON.stringify({
          error: `Frame ${frame.frame_number} generation failed`,
          partial_frames: generatedFrames,
          credits_used: creditsUsed,
        }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (imageUrl) {
        generatedFrames.push({
          frame_number: frame.frame_number,
          image_url: imageUrl,
        });
      }
    }

    // Deduct total credits
    await supabase.rpc("deduct_credits", {
      p_user_id: userId,
      p_amount: totalCost,
      p_action: "video_frames",
    });

    // Get new balance
    const { data: newWallet } = await supabase
      .from("user_wallets")
      .select("balance")
      .eq("user_id", userId)
      .single();

    return new Response(JSON.stringify({
      success: true,
      frames: generatedFrames,
      credits_used: totalCost,
      remaining_credits: newWallet?.balance ?? 0,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-video-frames error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
