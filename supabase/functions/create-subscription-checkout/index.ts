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

// Base fee constants - Stripe fees paid by creator
const STRIPE_PERCENT_FEE = 0.029; // 2.9% Stripe fee
const STRIPE_FIXED_FEE_CENTS = 30; // $0.30 Stripe fixed fee
const PLATFORM_FEE_PERCENT = 5; // 5% platform fee

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
      .select("*, profiles!creator_subscription_plans_creator_id_fkey(id, user_id, full_name, username)")
      .eq("id", plan_id)
      .single();

    if (planError || !plan) throw new Error("Subscription plan not found");
    logStep("Plan found", { planName: plan.name, priceCents: plan.price_cents });

    // Get the creator's profile data
    const creatorProfile = Array.isArray(plan.profiles) ? plan.profiles[0] : plan.profiles;
    if (!creatorProfile?.user_id) {
      throw new Error("Creator profile not found");
    }

    // Get creator's Stripe account from private schema
    const { data: sellerConfig, error: configError } = await supabaseClient.rpc(
      "get_seller_config",
      { p_user_id: creatorProfile.user_id }
    );

    if (configError) {
      logStep("Error getting seller config", { error: configError.message });
    }

    const creatorStripeAccountId = sellerConfig?.[0]?.stripe_account_id || null;
    const stripeOnboardingComplete = sellerConfig?.[0]?.stripe_onboarding_complete || false;

    // Allow subscriptions even if creator hasn't onboarded - funds go to platform
    const useConnect = creatorStripeAccountId && stripeOnboardingComplete;
    logStep("Payment routing decision", { 
      useConnect, 
      hasStripeAccount: !!creatorStripeAccountId, 
      onboardingComplete: stripeOnboardingComplete 
    });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer already exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    }

    // Create or get the Stripe product and price for this plan
    // Products are created in the SELLER's Stripe catalog for proper marketplace architecture
    let stripePriceId = plan.stripe_price_id;
    
    if (!stripePriceId) {
      // Create Stripe product if not exists - in SELLER's catalog
      let stripeProductId = plan.stripe_product_id;
      
      if (!stripeProductId) {
        if (!useConnect) {
          throw new Error("Creator must complete Stripe onboarding before creating subscription products");
        }
        
        // Create product in SELLER's Stripe catalog (not platform catalog)
        const product = await stripe.products.create({
          name: `${creatorProfile.full_name || creatorProfile.username}'s ${plan.name}`,
          metadata: {
            plan_id: plan.id,
            creator_id: plan.creator_id,
            platform: 'sellspay',
          },
        }, {
          stripeAccount: creatorStripeAccountId, // Creates in seller's catalog
        });
        stripeProductId = product.id;
        logStep("Stripe product created in seller catalog", { 
          productId: product.id, 
          sellerStripeId: creatorStripeAccountId 
        });

        // Save product ID to plan
        await supabaseClient
          .from("creator_subscription_plans")
          .update({ stripe_product_id: stripeProductId })
          .eq("id", plan.id);
      }

      // Create recurring price in SELLER's catalog
      const price = await stripe.prices.create({
        product: stripeProductId,
        unit_amount: plan.price_cents,
        currency: plan.currency.toLowerCase(),
        recurring: { interval: "month" },
        metadata: {
          plan_id: plan.id,
        },
      }, {
        stripeAccount: creatorStripeAccountId, // Creates in seller's catalog
      });
      stripePriceId = price.id;
      logStep("Stripe price created in seller catalog", { 
        priceId: price.id,
        sellerStripeId: creatorStripeAccountId
      });

      // Save price ID to plan
      await supabaseClient
        .from("creator_subscription_plans")
        .update({ stripe_price_id: stripePriceId })
        .eq("id", plan.id);
    }

    // Calculate fees (creator pays Stripe fees + 5% platform fee)
    const grossAmount = plan.price_cents;
    
    // Stripe's processing fee (2.9% + $0.30)
    const stripeProcessingFee = Math.round(grossAmount * STRIPE_PERCENT_FEE) + STRIPE_FIXED_FEE_CENTS;
    
    // Platform fee (5%)
    const platformFee = Math.round(grossAmount * (PLATFORM_FEE_PERCENT / 100));
    
    // Total application fee includes both Stripe fees and platform fee
    const totalApplicationFee = stripeProcessingFee + platformFee;
    
    // Creator receives: gross - all fees
    const creatorPayout = grossAmount - totalApplicationFee;
    
    // Calculate the application_fee_percent equivalent for Stripe's subscription API
    // Since Stripe subscription only supports percent, we need to calculate the combined rate
    const applicationFeePercent = Math.round((totalApplicationFee / grossAmount) * 10000) / 100;
    
    logStep("Fee breakdown", { 
      grossAmount,
      stripeProcessingFee,
      platformFee,
      totalApplicationFee,
      applicationFeePercent: `${applicationFeePercent}%`,
      creatorPayout,
      useConnect,
    });

    const origin = req.headers.get("origin") || "http://localhost:5173";

    // Build checkout session config
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
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
      metadata: {
        plan_id: plan.id,
        buyer_profile_id: buyerProfile.id,
        creator_user_id: creatorProfile.user_id,
        use_connect: useConnect ? "true" : "false",
      },
    };

    // Only use Connect if creator has completed onboarding
    if (useConnect) {
      sessionConfig.subscription_data = {
        application_fee_percent: applicationFeePercent,
        transfer_data: {
          destination: creatorStripeAccountId,
        },
        metadata: {
          plan_id: plan.id,
          buyer_profile_id: buyerProfile.id,
          platform_fee_cents: platformFee.toString(),
          stripe_fee_cents: stripeProcessingFee.toString(),
          creator_payout_cents: creatorPayout.toString(),
        },
      };
      logStep("Using Connect transfer to creator", { destination: creatorStripeAccountId });
    } else {
      // No Connect - funds stay in platform account, tracked for later payout
      sessionConfig.subscription_data = {
        metadata: {
          plan_id: plan.id,
          buyer_profile_id: buyerProfile.id,
          creator_user_id: creatorProfile.user_id,
          platform_fee_cents: platformFee.toString(),
          stripe_fee_cents: stripeProcessingFee.toString(),
          creator_payout_cents: creatorPayout.toString(),
          pending_transfer: "true", // Mark for later transfer when creator onboards
        },
      };
      logStep("Platform collection mode - creator not yet onboarded");
    }

    // Create checkout session - must use stripeAccount to access seller's product catalog
    const session = useConnect 
      ? await stripe.checkout.sessions.create(sessionConfig, { stripeAccount: creatorStripeAccountId })
      : await stripe.checkout.sessions.create(sessionConfig);

    logStep("Checkout session created", { 
      sessionId: session.id, 
      url: session.url,
      useConnect,
    });

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