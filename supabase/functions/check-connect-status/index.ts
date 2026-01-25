import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-STATUS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) throw new Error("Not authenticated");

    logStep("User authenticated", { userId: user.id });

    // Get profile id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      throw new Error("Profile not found");
    }

    // Get seller config from private schema
    const { data: sellerConfig, error: configError } = await supabaseAdmin.rpc(
      "get_seller_config",
      { p_user_id: user.id }
    );

    if (configError) {
      logStep("Error getting seller config", { error: configError.message });
    }

    const stripeAccountId = sellerConfig?.[0]?.stripe_account_id;
    const onboardingComplete = sellerConfig?.[0]?.stripe_onboarding_complete || false;

    if (!stripeAccountId) {
      return new Response(JSON.stringify({ 
        connected: false, 
        onboarding_complete: false,
        message: "No Stripe account linked" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Checking Stripe account", { accountId: stripeAccountId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const account = await stripe.accounts.retrieve(stripeAccountId);

    const isComplete = account.details_submitted && account.charges_enabled && account.payouts_enabled;

    logStep("Account status", { 
      details_submitted: account.details_submitted,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      isComplete 
    });

    // Update private config if status changed
    if (isComplete && !onboardingComplete) {
      await supabaseAdmin.rpc("update_seller_config", {
        p_user_id: user.id,
        p_stripe_onboarding_complete: true
      });
      
      logStep("Seller config updated - onboarding complete");
    }

    return new Response(JSON.stringify({ 
      connected: true,
      onboarding_complete: isComplete,
      details_submitted: account.details_submitted,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});