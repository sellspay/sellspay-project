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
  audio: StemResult[];
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
    let model = "fal-ai/demucs";
    let requestBody: Record<string, unknown>;

    switch (mode) {
      case "voice":
        // Voice isolation: returns vocals + instrumental (everything else combined)
        requestBody = {
          audio_url,
          model: "htdemucs",
          stems: "vocals", // This will give vocals and "no_vocals" (instrumental)
          output_format,
          shifts: 1,
          overlap: 0.25,
        };
        break;
      case "sfx":
        // SFX isolation: need full separation to get "other" stem
        requestBody = {
          audio_url,
          model: "htdemucs",
          stems: "all",
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
          stems: "all",
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

    // Call fal.ai API
    const response = await fetch("https://queue.fal.run/fal-ai/demucs", {
      method: "POST",
      headers: {
        "Authorization": `Key ${FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("fal.ai API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to process audio", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the request ID from the response for polling
    const queueResponse = await response.json();
    const requestId = queueResponse.request_id;

    if (!requestId) {
      console.error("No request_id in response:", queueResponse);
      return new Response(
        JSON.stringify({ error: "Failed to queue audio processing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Poll for results
    let result: DemucsResponse | null = null;
    let attempts = 0;
    const maxAttempts = 120; // 10 minutes max wait (5s intervals)

    while (!result && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      attempts++;

      const statusResponse = await fetch(`https://queue.fal.run/fal-ai/demucs/requests/${requestId}`, {
        headers: {
          "Authorization": `Key ${FAL_KEY}`,
        },
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        
        if (statusData.status === "COMPLETED") {
          result = statusData.response;
          break;
        } else if (statusData.status === "FAILED") {
          console.error("Processing failed:", statusData);
          return new Response(
            JSON.stringify({ error: "Audio processing failed", details: statusData.error }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        console.log(`Attempt ${attempts}: Status = ${statusData.status}`);
      }
    }

    if (!result) {
      return new Response(
        JSON.stringify({ error: "Processing timeout. Please try again with a shorter audio file." }),
        { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const processingTime = Date.now() - startTime;

    // Format the response based on mode
    const stems: Record<string, { url: string; filename: string }> = {};

    if (result.audio && Array.isArray(result.audio)) {
      for (const stem of result.audio) {
        // Extract stem name from filename (e.g., "vocals.mp3" -> "vocals")
        const stemName = stem.file_name.replace(/\.[^/.]+$/, "").toLowerCase();
        stems[stemName] = {
          url: stem.url,
          filename: stem.file_name,
        };
      }
    }

    console.log(`Processing completed in ${processingTime}ms. Stems:`, Object.keys(stems));

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
