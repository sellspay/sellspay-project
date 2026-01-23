import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-SUBSCRIPTION-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get buyer's profile ID
    const { data: buyerProfile } = await supabaseClient
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!buyerProfile) throw new Error("Buyer profile not found");
    logStep("Buyer profile found", { profileId: buyerProfile.id });

    // Get the plan ID from request body
    const { plan_id } = await req.json();
    if (!plan_id) throw new Error("Plan ID is required");
    logStep("Plan ID received", { planId: plan_id });

    // Fetch the plan details
    const { data: plan, error: planError } = await supabaseClient
      .from("creator_subscription_plans")
      .select("*, profiles!creator_subscription_plans_creator_id_fkey(stripe_account_id, full_name, username)")
      .eq("id", plan_id)
      .single();

    if (planError || !plan) throw new Error("Subscription plan not found");
    logStep("Plan found", { planName: plan.name, priceCents: plan.price_cents });

    // Get the creator's profile data
    const creatorProfile = Array.isArray(plan.profiles) ? plan.profiles[0] : plan.profiles;
    if (!creatorProfile?.stripe_account_id) {
      throw new Error("Creator has not completed Stripe onboarding");
    }
    logStep("Creator Stripe account found", { accountId: creatorProfile.stripe_account_id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer already exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    }

    // Create or get the Stripe product and price for this plan
    let stripePriceId = plan.stripe_price_id;
    
    if (!stripePriceId) {
      // Create Stripe product if not exists
      let stripeProductId = plan.stripe_product_id;
      
      if (!stripeProductId) {
        const product = await stripe.products.create({
          name: `${creatorProfile.full_name || creatorProfile.username}'s ${plan.name}`,
          metadata: {
            plan_id: plan.id,
            creator_id: plan.creator_id,
          },
        });
        stripeProductId = product.id;
        logStep("Stripe product created", { productId: product.id });

        // Save product ID to plan
        await supabaseClient
          .from("creator_subscription_plans")
          .update({ stripe_product_id: stripeProductId })
          .eq("id", plan.id);
      }

      // Create recurring price
      const price = await stripe.prices.create({
        product: stripeProductId,
        unit_amount: plan.price_cents,
        currency: plan.currency.toLowerCase(),
        recurring: { interval: "month" },
        metadata: {
          plan_id: plan.id,
        },
      });
      stripePriceId = price.id;
      logStep("Stripe price created", { priceId: price.id });

      // Save price ID to plan
      await supabaseClient
        .from("creator_subscription_plans")
        .update({ stripe_price_id: stripePriceId })
        .eq("id", plan.id);
    }

    // Calculate 5% platform fee
    const platformFeePercent = 5;
    const applicationFeeAmount = Math.round(plan.price_cents * (platformFeePercent / 100));
    logStep("Fee calculated", { platformFee: applicationFeeAmount, creatorPayout: plan.price_cents - applicationFeeAmount });

    // Create checkout session with Connect
    const origin = req.headers.get("origin") || "http://localhost:5173";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/profile?subscription=success`,
      cancel_url: `${origin}/profile?subscription=cancelled`,
      subscription_data: {
        application_fee_percent: platformFeePercent,
        transfer_data: {
          destination: creatorProfile.stripe_account_id,
        },
        metadata: {
          plan_id: plan.id,
          buyer_profile_id: buyerProfile.id,
        },
      },
      metadata: {
        plan_id: plan.id,
        buyer_profile_id: buyerProfile.id,
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});