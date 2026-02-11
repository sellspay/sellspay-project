import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Maps tool_id to the system prompt and expected output type
const STEP_CONFIGS: Record<string, { systemPrompt: string; outputKey: string }> = {
  "product-description": {
    systemPrompt: "You are a product copywriter. Extract and rewrite the key benefits and selling points of a product in a compelling, SEO-optimized format. Return JSON: {\"benefits\": [\"...\"], \"headline\": \"...\", \"description\": \"...\"}",
    outputKey: "description",
  },
  "social-posts-pack": {
    systemPrompt: "You are a social media expert. Generate 10 engaging social media posts for the given product. Each post should have a different angle. Return JSON: {\"posts\": [{\"text\": \"...\", \"platform\": \"instagram|twitter|tiktok\"}]}",
    outputKey: "posts",
  },
  "short-form-script": {
    systemPrompt: "You are a short-form video scriptwriter. Create a compelling 15-30 second video script with hook, body, and CTA. Return JSON: {\"hook\": \"...\", \"body\": \"...\", \"cta\": \"...\", \"duration_seconds\": 15}",
    outputKey: "script",
  },
  "tts-voiceover": {
    systemPrompt: "You are a voiceover script optimizer. Clean up and optimize the given script for text-to-speech delivery. Add pauses, emphasis markers, and adjust pacing. Return JSON: {\"voiceover_text\": \"...\", \"estimated_duration_seconds\": 15, \"voice_style\": \"energetic|calm|professional\"}",
    outputKey: "voiceover",
  },
  "caption-hashtags": {
    systemPrompt: "You are a social media caption expert. Generate 5 caption variations with optimized hashtag sets. Return JSON: {\"captions\": [{\"text\": \"...\", \"hashtags\": [\"#...\"]}]}",
    outputKey: "captions",
  },
  "carousel-generator": {
    systemPrompt: "You are a carousel content designer. Create a multi-slide carousel plan (5-10 slides). Return JSON: {\"slides\": [{\"headline\": \"...\", \"body\": \"...\", \"visual_suggestion\": \"...\"}]}",
    outputKey: "carousel",
  },
  "subtitle-generator": {
    systemPrompt: "You are a subtitle/caption writer. Generate timed subtitle entries from the given script. Return JSON: {\"subtitles\": [{\"start_seconds\": 0, \"end_seconds\": 3, \"text\": \"...\"}]}",
    outputKey: "subtitles",
  },
  "thumbnail-generator": {
    systemPrompt: "You are a thumbnail design consultant. Describe 3 compelling thumbnail concepts for the product. Return JSON: {\"concepts\": [{\"description\": \"...\", \"text_overlay\": \"...\", \"color_scheme\": \"...\"}]}",
    outputKey: "thumbnails",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!GEMINI_KEY) throw new Error("GOOGLE_GEMINI_API_KEY not configured");

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { tool_id, product_context, previous_outputs, run_id, step_index } = await req.json();

    const config = STEP_CONFIGS[tool_id];
    if (!config) {
      return new Response(JSON.stringify({ error: `Unknown tool: ${tool_id}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build context from product and previous step outputs
    const productInfo = product_context
      ? `Product: ${product_context.name}\nDescription: ${product_context.description || product_context.excerpt || ""}\nTags: ${(product_context.tags || []).join(", ")}\nPrice: ${product_context.price_cents ? "$" + (product_context.price_cents / 100).toFixed(2) : "Free"}`
      : "No specific product selected.";

    const prevContext = previous_outputs?.length
      ? `\n\nPrevious step outputs:\n${previous_outputs.map((o: any, i: number) => `Step ${i + 1} (${o.tool_id}): ${JSON.stringify(o.result).slice(0, 500)}`).join("\n")}`
      : "";

    const userPrompt = `${productInfo}${prevContext}\n\nGenerate the output for this step. Respond ONLY with valid JSON.`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GEMINI_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gemini-2.5-flash",
          messages: [
            { role: "system", content: config.systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    let result: any;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
                        content.match(/```\s*([\s\S]*?)\s*```/);
      const rawJson = jsonMatch ? jsonMatch[1] : content;
      result = JSON.parse(rawJson.trim());
    } catch {
      // If JSON parse fails, return the raw text as result
      result = { raw_text: content };
    }

    // Deduct 1 credit per step
    await supabase.rpc("deduct_credits", {
      p_user_id: userData.user.id,
      p_amount: 1,
      p_action: `campaign_step_${tool_id}`,
    });

    // Update campaign run step state
    if (run_id) {
      const { data: runData } = await supabase
        .from("campaign_runs")
        .select("steps_state, total_credits_used")
        .eq("id", run_id)
        .single();

      if (runData) {
        const stepsState = (runData as any).steps_state as any[];
        if (stepsState[step_index]) {
          stepsState[step_index].status = "done";
          stepsState[step_index].output_summary = JSON.stringify(result).slice(0, 200);
        }

        await supabase
          .from("campaign_runs")
          .update({
            current_step_index: step_index + 1,
            steps_state: stepsState,
            total_credits_used: ((runData as any).total_credits_used || 0) + 1,
          } as any)
          .eq("id", run_id);
      }
    }

    return new Response(JSON.stringify({ success: true, result, tool_id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("run-campaign-step error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
