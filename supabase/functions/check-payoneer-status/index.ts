import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CHECK-PAYONEER-STATUS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      // Return safe defaults for unauthenticated requests
      return new Response(
        JSON.stringify({
          success: true,
          payoneerConfigured: false,
          payoneerEmail: null,
          payoneerPayeeId: null,
          payoneerStatus: null,
          paypalConfigured: false,
          paypalEmail: null,
          paypalConnected: false,
          preferredPayoutMethod: "stripe",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData?.user?.email) {
      // Return safe defaults if auth fails
      return new Response(
        JSON.stringify({
          success: true,
          payoneerConfigured: false,
          payoneerEmail: null,
          payoneerPayeeId: null,
          payoneerStatus: null,
          paypalConfigured: false,
          paypalEmail: null,
          paypalConnected: false,
          preferredPayoutMethod: "stripe",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }
    
    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    // Get profile id
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) throw new Error("Profile not found");
    logStep("Profile found", { profileId: profile.id });

    // Get seller config from private schema
    const { data: sellerConfig, error: configError } = await supabaseClient.rpc(
      "get_seller_config",
      { p_user_id: user.id }
    );

    if (configError) {
      logStep("Error getting seller config", { error: configError.message });
    }

    const config = sellerConfig?.[0];

    // Check if Payoneer is configured
    const payoneerConfigured = !!(
      Deno.env.get("PAYONEER_PARTNER_ID") &&
      Deno.env.get("PAYONEER_API_USERNAME") &&
      Deno.env.get("PAYONEER_API_PASSWORD") &&
      Deno.env.get("PAYONEER_PROGRAM_ID")
    );

    // Check if PayPal is configured
    const paypalConfigured = !!(
      Deno.env.get("PAYPAL_CLIENT_ID") &&
      Deno.env.get("PAYPAL_CLIENT_SECRET")
    );

    // Get Stripe connection status
    const stripeConnected = !!(config?.stripe_account_id && config?.stripe_onboarding_complete);

    return new Response(
      JSON.stringify({
        success: true,
        payoneerConfigured,
        payoneerEmail: config?.payoneer_email || null,
        payoneerPayeeId: null, // Not exposed for security
        payoneerStatus: config?.payoneer_status || null,
        // PayPal fields
        paypalConfigured,
        paypalEmail: config?.paypal_email || null,
        paypalConnected: config?.paypal_payout_enabled || false,
        // Stripe fields
        stripeConnected,
        preferredPayoutMethod: config?.preferred_payout_method || "stripe",
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