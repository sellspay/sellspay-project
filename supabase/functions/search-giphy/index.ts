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
    const { query, limit = 20, trending = false } = await req.json();

    const apiKey = Deno.env.get("GIPHY_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GIPHY API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let url: string;
    
    if (trending || !query) {
      // Fetch trending GIFs
      url = `https://api.giphy.com/v1/gifs/trending?api_key=${apiKey}&limit=${limit}&rating=pg-13`;
    } else {
      // Search GIFs
      url = `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&limit=${limit}&rating=pg-13`;
    }
    
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch from GIPHY");
    }

    // Return simplified GIF data
    const gifs = data.data.map((gif: any) => ({
      id: gif.id,
      title: gif.title,
      url: gif.images.fixed_height.url,
      width: gif.images.fixed_height.width,
      height: gif.images.fixed_height.height,
      preview: gif.images.fixed_height_small.url,
    }));

    return new Response(
      JSON.stringify({ gifs }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("GIPHY search error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to search GIFs";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
