import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

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
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    // Get the origin for redirect after login
    const body = await req.json().catch(() => ({}));
    const returnTo = body.returnTo || "/";
    const origin = body.origin || "https://sellspay.com";
    const linkAccount = body.linkAccount || false;
    
    let linkingUserId: string | null = null;
    
    // If this is a linking attempt, we MUST verify the user is authenticated
    // and pass their user ID securely
    if (linkAccount) {
      // Get the auth header to verify user
      const authHeader = req.headers.get("authorization");
      if (!authHeader) {
        return new Response(
          JSON.stringify({ success: false, error: "Authentication required to link accounts" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
        );
      }
      
      // Verify the user's session
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false }
      });
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        logStep("User not authenticated for linking", { error: userError?.message });
        return new Response(
          JSON.stringify({ success: false, error: "You must be logged in to link Discord" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
        );
      }
      
      linkingUserId = user.id;
      logStep("Authenticated user for linking", { userId: linkingUserId });
    }
    
    // Create a state token to prevent CSRF and store return URL
    const stateData = {
      returnTo,
      timestamp: Date.now(),
      nonce: crypto.randomUUID(),
      linkAccount,
      linkingUserId,
      origin,
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

    logStep("OAuth URL generated", { linkAccount, hasLinkingUserId: !!linkingUserId });

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
