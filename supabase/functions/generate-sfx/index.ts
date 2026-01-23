import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, duration = 10 } = await req.json();

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const FAL_KEY = Deno.env.get("FAL_KEY");
    if (!FAL_KEY) {
      console.error("FAL_KEY not configured");
      return new Response(
        JSON.stringify({ error: "FAL_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating SFX: "${prompt}", duration: ${duration}s`);

    const startTime = Date.now();

    // Use fal.ai's beatoven/sound-effect-generation endpoint
    const response = await fetch("https://fal.run/fal-ai/beatoven/sound-effect-generation", {
      method: "POST",
      headers: {
        "Authorization": `Key ${FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompt.trim(),
        duration_seconds: Math.min(Math.max(duration, 1), 30), // Clamp between 1-30 seconds
      }),
    });

    const responseText = await response.text();
    console.log("fal.ai response status:", response.status);
    console.log("fal.ai response body:", responseText.substring(0, 500));

    if (!response.ok) {
      console.error("fal.ai API error:", response.status, responseText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to generate sound effect", details: responseText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result: { audio?: { url: string; content_type?: string; file_name?: string; file_size?: number } };
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse fal.ai response:", e);
      return new Response(
        JSON.stringify({ error: "Invalid response from audio generator" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const processingTime = Date.now() - startTime;
    console.log("Generation completed in", processingTime, "ms");

    if (!result.audio?.url) {
      console.error("No audio URL in result:", result);
      return new Response(
        JSON.stringify({ error: "No audio generated", raw: result }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        audio_url: result.audio.url,
        filename: result.audio.file_name || "generated-sfx.wav",
        duration_seconds: duration,
        processing_time_ms: processingTime,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating SFX:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
