import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SILENT-CONNECT] ${step}${detailsStr}`);
};

/**
 * Creates a Stripe Connect Express account silently (without redirecting to onboarding).
 * This enables the "Sell First, Withdraw Later" flow where sellers can list products
 * immediately but funds are held until they complete Stripe verification.
 */
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
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Authorization required");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }

    const user = userData.user;
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get user's profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, seller_country_code, seller_mode")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      throw new Error("Profile not found");
    }
    logStep("Profile found", { profileId: profile.id, countryCode: profile.seller_country_code });

    // Check if already has a Stripe account
    const { data: existingConfig } = await supabaseAdmin.rpc(
      "get_seller_config",
      { p_user_id: user.id }
    );

    if (existingConfig?.[0]?.stripe_account_id) {
      logStep("Stripe account already exists", { accountId: existingConfig[0].stripe_account_id });
      return new Response(JSON.stringify({ 
        success: true,
        accountId: existingConfig[0].stripe_account_id,
        message: "Stripe account already created"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check country eligibility for Stripe Connect
    const countryCode = profile.seller_country_code;
    if (countryCode) {
      const { data: eligibility } = await supabaseAdmin
        .from("country_eligibility")
        .select("connect_eligible, country_name")
        .eq("country_code", countryCode)
        .single();

      if (eligibility && !eligibility.connect_eligible) {
        logStep("Country not eligible for Stripe Connect", { countryCode });
        // Still allow selling, but they'll use alternative payout methods
        return new Response(JSON.stringify({ 
          success: true,
          accountId: null,
          message: "Country not eligible for Stripe Connect. You can still sell and use PayPal or Payoneer for payouts.",
          alternativeMethods: true
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Get user email from private schema
    const { data: userPii } = await supabaseAdmin.rpc(
      "get_user_pii",
      { p_user_id: user.id }
    );

    const userEmail = userPii?.[0]?.email || user.email;

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Create a new Connect account (Express type for easier onboarding later)
    logStep("Creating silent Connect account");
    
    const account = await stripe.accounts.create({
      type: "express",
      email: userEmail,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: "individual",
      ...(countryCode && { country: countryCode }),
      metadata: {
        sellspay_user_id: user.id,
        sellspay_profile_id: profile.id,
        created_silently: "true",
      },
    });

    logStep("Connect account created silently", { accountId: account.id });

    // Save the account ID to private.seller_config
    await supabaseAdmin.rpc("update_seller_config", {
      p_user_id: user.id,
      p_stripe_account_id: account.id,
      p_stripe_onboarding_complete: false
    });

    // Update profile with seller_mode = CONNECT but NOT complete
    await supabaseAdmin
      .from("profiles")
      .update({ 
        seller_mode: "CONNECT",
        seller_status: "pending_verification" // They can sell, but can't withdraw yet
      })
      .eq("id", profile.id);

    logStep("Stripe account saved and seller enabled for sales");

    return new Response(JSON.stringify({ 
      success: true,
      accountId: account.id,
      message: "Stripe account created. You can now start selling! Complete verification to withdraw earnings."
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
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
