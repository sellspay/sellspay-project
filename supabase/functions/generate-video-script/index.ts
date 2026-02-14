import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VideoScriptRequest {
  productName: string;
  productDescription: string;
  productTags?: string[];
  productPrice?: string;
  duration: number; // seconds
  frameCount?: number;
  style: "cinematic" | "ugc" | "tutorial" | "hype" | "minimal";
  includeVoiceover: boolean;
  aspectRatio: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: VideoScriptRequest = await req.json();
    const GEMINI_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!GEMINI_KEY) throw new Error("GOOGLE_GEMINI_API_KEY not configured");

    const {
      productName,
      productDescription,
      productTags = [],
      productPrice,
      duration,
      frameCount: frameCountInput,
      style,
      includeVoiceover,
      aspectRatio,
    } = body;

    // Use provided frameCount or calculate based on duration
    const frameCount = frameCountInput ?? Math.max(3, Math.min(8, Math.ceil(duration / 5)));

    const systemPrompt = `You are a professional video scriptwriter for product promo videos. 
You create compelling, conversion-focused scripts with frame-by-frame breakdowns.
Always respond with valid JSON matching the requested schema.`;

    const userPrompt = `Create a ${duration}-second ${style} promo video script for:

Product: ${productName}
Description: ${productDescription}
Tags: ${productTags.join(", ")}
${productPrice ? `Price: ${productPrice}` : ""}
Aspect Ratio: ${aspectRatio}

Generate exactly ${frameCount} frames. For each frame provide:
- frame_number (1-indexed)
- duration_seconds (how long this frame shows)
- visual_description (what appears on screen - be specific about composition, colors, motion)
- text_overlay (any text shown on screen, keep short)
- voiceover_text (narration for this frame${!includeVoiceover ? " - leave empty" : ""})
- transition (cut/fade/slide/zoom - transition TO next frame)

Also provide:
- title: A catchy title for the video
- hook: The opening hook line (first 3 seconds)
- cta: Call-to-action text
- hashtags: 5 relevant hashtags
- music_mood: Suggested background music mood

Respond ONLY with valid JSON in this exact format:
{
  "title": "string",
  "hook": "string",
  "cta": "string",
  "hashtags": ["string"],
  "music_mood": "string",
  "total_duration": ${duration},
  "frames": [
    {
      "frame_number": 1,
      "duration_seconds": 3,
      "visual_description": "string",
      "text_overlay": "string",
      "voiceover_text": "string",
      "transition": "cut"
    }
  ]
}`;

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
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: "AI generation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Extract JSON from response (handle markdown code blocks)
    let scriptJson: any;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                        content.match(/```\s*([\s\S]*?)\s*```/);
      const rawJson = jsonMatch ? jsonMatch[1] : content;
      scriptJson = JSON.parse(rawJson.trim());
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr, "Content:", content);
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response", raw: content }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(scriptJson), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-video-script error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
