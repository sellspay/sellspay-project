import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BLOCKED_PATTERNS = [
  /\b(kill|murder|slaughter|massacre)\b.*\b(people|children|humans)\b/i,
  /\b(nude|naked|porn|hentai|xxx|nsfw|erotic|sexually\s+explicit)\b/i,
  /\b(deepfake|impersonat)\b/i,
  /\bhow\s+to\s+(make|cook|synthesize)\s+(meth|cocaine|heroin|drugs)\b/i,
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!GEMINI_KEY) throw new Error("GOOGLE_GEMINI_API_KEY not configured");

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

    const { product, outputs, style, goal, direction } = await req.json();

    // Validate
    if (!product?.name) {
      return new Response(JSON.stringify({ error: "Product name is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!outputs || outputs.length === 0) {
      return new Response(JSON.stringify({ error: "At least one output is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Content moderation
    const textToCheck = [product.name, product.description, product.excerpt, direction].filter(Boolean).join(" ");
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(textToCheck)) {
        return new Response(JSON.stringify({ error: "Content policy violation" }), {
          status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Build output instructions per selected type
    const outputInstructions: string[] = [];
    const outputSchemas: string[] = [];

    if (outputs.includes("hooks")) {
      outputInstructions.push("Generate 5 scroll-stopping hooks (short, punchy, attention-grabbing opening lines).");
      outputSchemas.push('"hooks": ["string"]');
    }
    if (outputs.includes("captions")) {
      outputInstructions.push("Generate 3 social media captions with hashtags. Each should have a different angle (emotional, benefit-driven, urgency).");
      outputSchemas.push('"captions": [{"text": "string", "hashtags": ["string"]}]');
    }
    if (outputs.includes("carousel")) {
      outputInstructions.push("Create a 5-slide Instagram/TikTok carousel plan with headlines, body text, and visual descriptions for each slide.");
      outputSchemas.push('"carousel": [{"slide_number": "number", "headline": "string", "body": "string", "visual": "string"}]');
    }
    if (outputs.includes("listing-rewrite")) {
      outputInstructions.push("Rewrite the product listing with an SEO-optimized headline, compelling description, and 5 key benefits.");
      outputSchemas.push('"listing_rewrite": {"headline": "string", "description": "string", "benefits": ["string"]}');
    }
    if (outputs.includes("email-draft")) {
      outputInstructions.push("Write a promotional email with subject line, preview text, and body (with sections: hook, benefits, CTA).");
      outputSchemas.push('"email_draft": {"subject": "string", "preview_text": "string", "body": "string"}');
    }
    if (outputs.includes("promo-video")) {
      outputInstructions.push("Write a 15-30 second promo video script with: hook (first 3 seconds), body (product showcase), and CTA. Include visual direction notes for each section.");
      outputSchemas.push('"promo_video": {"hook": {"text": "string", "visual": "string", "duration_seconds": "number"}, "body": [{"text": "string", "visual": "string", "duration_seconds": "number"}], "cta": {"text": "string", "visual": "string", "duration_seconds": "number"}, "total_duration_seconds": "number"}');
    }

    const productInfo = `Product: ${product.name}
Description: ${product.description || product.excerpt || "No description provided"}
Tags: ${(product.tags || []).join(", ") || "None"}
Price: ${product.price_cents ? "$" + (product.price_cents / 100).toFixed(2) : "Free"}`;

    const styleInfo = style ? `Campaign Style: ${style.name} — ${style.desc}` : "";
    const goalInfo = goal ? `Campaign Goal: ${goal}` : "";
    const directionInfo = direction ? `Creative Direction: ${direction}` : "";

    const systemPrompt = `You are an expert marketing strategist and copywriter. Generate a complete marketing campaign pack for the given product. 
Your output must be optimized for conversion and engagement.
Adapt your tone and approach to the campaign style and goal provided.
Respond ONLY with valid JSON matching the exact schema specified.`;

    const userPrompt = `${productInfo}
${styleInfo}
${goalInfo}
${directionInfo}

Generate the following outputs:
${outputInstructions.map((inst, i) => `${i + 1}. ${inst}`).join("\n")}

Respond with a single JSON object containing these keys:
{${outputSchemas.join(", ")}}`;

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
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.8,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("Gemini error:", response.status, errText);
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let result: any;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
                        content.match(/```\s*([\s\S]*?)\s*```/);
      const rawJson = jsonMatch ? jsonMatch[1] : content;
      result = JSON.parse(rawJson.trim());
    } catch {
      result = { raw_text: content };
    }

    // Deduct credits (1 per output type)
    const creditsToDeduct = outputs.length;
    await supabase.rpc("deduct_credits", {
      p_user_id: userData.user.id,
      p_amount: creditsToDeduct,
      p_action: "campaign_pack_generate",
    });

    return new Response(JSON.stringify({ success: true, result, credits_used: creditsToDeduct }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-campaign-pack error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
