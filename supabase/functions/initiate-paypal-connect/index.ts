import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[INITIATE-PAYPAL-CONNECT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
    const clientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      logStep("PayPal not configured");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "PayPal integration is not yet configured.",
          notConfigured: true 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    // Use anon client to verify user token
    const supabaseAnonClient = createClient(supabaseUrl, supabaseAnonKey);
    // Use service role client for DB writes (RLS bypass)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAnonClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Get the origin for redirect URL
    const body = await req.json().catch(() => ({}));
    const origin = body.origin || "https://editorsparadise.lovable.app";
    
    // Create a state token to prevent CSRF and link back to user
    const stateData = {
      userId: user.id,
      timestamp: Date.now(),
      nonce: crypto.randomUUID(),
    };
    const state = btoa(JSON.stringify(stateData));

    // Store state in database for verification on callback (use admin client to bypass RLS)
    const { error: stateError } = await supabaseAdmin
      .from("paypal_oauth_states")
      .insert({
        state_token: state,
        user_id: user.id,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min expiry
      });

    if (stateError) {
      logStep("Error storing state", { error: stateError.message });
      // Continue anyway - we'll validate by decoding the state
    }

    // PayPal OAuth URL - using Identity API for login
    // We're using the "Log in with PayPal" flow which gives us verified user info
    const redirectUri = `${supabaseUrl}/functions/v1/paypal-oauth-callback`;
    const scopes = "openid email profile"; // Request email and profile info
    
    // PayPal sandbox vs live
    const isLive = Deno.env.get("PAYPAL_ENVIRONMENT") === "live";
    const paypalBase = isLive 
      ? "https://www.paypal.com" 
      : "https://www.sandbox.paypal.com";

    const authUrl = new URL(`${paypalBase}/signin/authorize`);
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", scopes);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("state", state);
    // flowEntry=static means it's a merchant connecting, not a buyer
    authUrl.searchParams.set("flowEntry", "static");

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
