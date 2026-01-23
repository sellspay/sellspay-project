import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StemResult {
  url: string;
  content_type: string;
  file_name: string;
  file_size: number;
}

interface DemucsResponse {
  audio?: StemResult[];
  vocals?: StemResult;
  no_vocals?: StemResult;
  drums?: StemResult;
  bass?: StemResult;
  other?: StemResult;
  guitar?: StemResult;
  piano?: StemResult;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audio_url, mode, output_format = "mp3" } = await req.json();

    if (!audio_url) {
      return new Response(
        JSON.stringify({ error: "audio_url is required" }),
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

    console.log(`Processing audio: ${audio_url}, mode: ${mode}`);

    // Determine which model and stems based on mode
    let requestBody: Record<string, unknown>;

    switch (mode) {
      case "voice":
        // Voice isolation: returns vocals + instrumental (no_vocals)
        requestBody = {
          audio_url,
          model: "htdemucs",
          stems: ["vocals"],
          output_format,
          shifts: 1,
          overlap: 0.25,
        };
        break;
      case "sfx":
        // SFX isolation: full separation to get "other" stem
        requestBody = {
          audio_url,
          model: "htdemucs",
          stems: ["vocals", "drums", "bass", "other"],
          output_format,
          shifts: 1,
          overlap: 0.25,
        };
        break;
      case "full":
        // Full 6-stem separation
        requestBody = {
          audio_url,
          model: "htdemucs_6s",
          stems: ["vocals", "drums", "bass", "guitar", "piano", "other"],
          output_format,
          shifts: 1,
          overlap: 0.25,
        };
        break;
      default:
        return new Response(
          JSON.stringify({ error: "Invalid mode. Use 'voice', 'sfx', or 'full'" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const startTime = Date.now();

    // Use the synchronous fal.ai endpoint (waits for completion)
    console.log("Sending request to fal.ai sync endpoint...");
    const response = await fetch("https://fal.run/fal-ai/demucs", {
      method: "POST",
      headers: {
        "Authorization": `Key ${FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
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
        JSON.stringify({ error: "Failed to process audio", details: responseText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result: DemucsResponse;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse fal.ai response:", e);
      return new Response(
        JSON.stringify({ error: "Invalid response from audio processor" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const processingTime = Date.now() - startTime;
    console.log("Processing completed in", processingTime, "ms");
    console.log("Result keys:", Object.keys(result));

    // Format the response based on the result structure
    const stems: Record<string, { url: string; filename: string }> = {};

    // Handle array format (audio: [...])
    if (result.audio && Array.isArray(result.audio)) {
      for (const stem of result.audio) {
        const stemName = stem.file_name.replace(/\.[^/.]+$/, "").toLowerCase();
        stems[stemName] = {
          url: stem.url,
          filename: stem.file_name,
        };
      }
    }

    // Handle direct object format (vocals: {...}, no_vocals: {...}, etc.)
    const stemKeys = ["vocals", "no_vocals", "drums", "bass", "other", "guitar", "piano"];
    for (const key of stemKeys) {
      const stem = result[key as keyof DemucsResponse];
      if (stem && typeof stem === "object" && "url" in stem) {
        stems[key] = {
          url: stem.url,
          filename: stem.file_name || `${key}.${output_format}`,
        };
      }
    }

    console.log("Processed stems:", Object.keys(stems));

    if (Object.keys(stems).length === 0) {
      console.error("No stems found in result:", result);
      return new Response(
        JSON.stringify({ error: "No audio stems returned from processing", raw: result }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        stems,
        processing_time_ms: processingTime,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error processing audio:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
