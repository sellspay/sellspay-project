import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[INITIATE-DISCORD-LOGIN] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const clientId = Deno.env.get("DISCORD_CLIENT_ID");
    const clientSecret = Deno.env.get("DISCORD_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      logStep("Discord not configured");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Discord integration is not yet configured.",
          notConfigured: true 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";

    // Get the origin for redirect after login
    const body = await req.json().catch(() => ({}));
    const returnTo = body.returnTo || "/";
    const linkAccount = body.linkAccount || false;
    
    // Create a state token to prevent CSRF and store return URL
    const stateData = {
      returnTo,
      timestamp: Date.now(),
      nonce: crypto.randomUUID(),
      linkAccount, // Flag to indicate this is for linking, not signup
    };
    const state = btoa(JSON.stringify(stateData));

    // Discord OAuth URL
    const redirectUri = `${supabaseUrl}/functions/v1/discord-oauth-callback`;
    const scopes = "identify email";
    
    const authUrl = new URL("https://discord.com/api/oauth2/authorize");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", scopes);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("prompt", "consent");

    logStep("OAuth URL generated", { url: authUrl.toString() });

    return new Response(
      JSON.stringify({
        success: true,
        authUrl: authUrl.toString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
