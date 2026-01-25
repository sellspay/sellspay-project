import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-STRIPE-BALANCE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header provided" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) {
      return new Response(
        JSON.stringify({ error: `Authentication error: ${userError.message}` }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const user = userData.user;
    if (!user) {
      return new Response(
        JSON.stringify({ error: "User not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    logStep("User authenticated", { userId: user.id });

    // Get user's profile id
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get seller config from private schema
    const { data: sellerConfig, error: configError } = await supabaseClient.rpc(
      "get_seller_config",
      { p_user_id: user.id }
    );

    if (configError) {
      logStep("Error getting seller config", { error: configError.message });
    }

    const config = sellerConfig?.[0];
    const stripeAccountId = config?.stripe_account_id;
    const onboardingComplete = config?.stripe_onboarding_complete;

    if (!stripeAccountId || !onboardingComplete) {
      return new Response(
        JSON.stringify({ 
          connected: false,
          availableBalance: 0,
          pendingBalance: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    logStep("Profile found", { profileId: profile.id, stripeAccountId });

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get the connected account's balance
    const balance = await stripe.balance.retrieve({
      stripeAccount: stripeAccountId,
    });

    logStep("Balance retrieved", { available: balance.available, pending: balance.pending });

    // Calculate balances (USD only for simplicity)
    const availableBalance = balance.available.reduce((acc: number, b: Stripe.Balance.Available) => {
      if (b.currency === "usd") return acc + b.amount;
      return acc;
    }, 0);

    const pendingBalance = balance.pending.reduce((acc: number, b: Stripe.Balance.Pending) => {
      if (b.currency === "usd") return acc + b.amount;
      return acc;
    }, 0);

    return new Response(
      JSON.stringify({
        connected: true,
        availableBalance,
        pendingBalance,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});