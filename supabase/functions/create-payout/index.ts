import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PAYOUT] ${step}${detailsStr}`);
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

    // Parse request body
    const body = await req.json();
    const { instant } = body; // true for instant (3% fee), false for standard (free, 1-3 days)
    logStep("Request parsed", { instant });

    // Get user's profile with Stripe account
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("id, stripe_account_id, stripe_onboarding_complete")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!profile.stripe_account_id || !profile.stripe_onboarding_complete) {
      return new Response(
        JSON.stringify({ error: "Stripe account not connected or onboarding incomplete" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Profile found", { profileId: profile.id, stripeAccountId: profile.stripe_account_id });

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get the connected account's balance
    const balance = await stripe.balance.retrieve({
      stripeAccount: profile.stripe_account_id,
    });

    logStep("Balance retrieved", { balance: balance.available });

    // Calculate available balance (sum of all currencies, convert to USD cents)
    const availableBalance = balance.available.reduce((acc: number, b: Stripe.Balance.Available) => {
      if (b.currency === "usd") return acc + b.amount;
      return acc; // For simplicity, only handle USD
    }, 0);

    if (availableBalance <= 0) {
      return new Response(
        JSON.stringify({ error: "No available balance to withdraw", availableBalance: 0 }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate payout amount after fee (if instant)
    let payoutAmount = availableBalance;
    let feeAmount = 0;
    
    if (instant) {
      feeAmount = Math.round(availableBalance * 0.03); // 3% instant fee
      payoutAmount = availableBalance - feeAmount;
    }

    logStep("Payout calculation", { 
      availableBalance, 
      feeAmount, 
      payoutAmount, 
      instant 
    });

    // Create payout on the connected account
    const payout = await stripe.payouts.create(
      {
        amount: payoutAmount,
        currency: "usd",
        method: instant ? "instant" : "standard",
      },
      {
        stripeAccount: profile.stripe_account_id,
      }
    );

    logStep("Payout created", { 
      payoutId: payout.id, 
      amount: payout.amount, 
      method: payout.method,
      arrivalDate: payout.arrival_date 
    });

    return new Response(
      JSON.stringify({
        success: true,
        payoutId: payout.id,
        amount: payoutAmount,
        fee: feeAmount,
        method: instant ? "instant" : "standard",
        arrivalDate: payout.arrival_date,
        estimatedArrival: instant ? "Instant" : "1-3 business days",
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
