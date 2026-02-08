import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CREATOR-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get auth user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("Unauthorized");
    }

    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    // Parse request body
    const { name, description, price_cents, currency, creator_id } = await req.json();

    if (!name || !price_cents || !creator_id) {
      throw new Error("Missing required fields: name, price_cents, creator_id");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get creator's Stripe account from private schema
    const { data: creatorProfile } = await supabaseClient
      .from("profiles")
      .select("user_id")
      .eq("id", creator_id)
      .single();

    if (!creatorProfile?.user_id) {
      throw new Error("Creator profile not found");
    }

    const { data: sellerConfig } = await supabaseClient.rpc(
      "get_seller_config",
      { p_user_id: creatorProfile.user_id }
    );

    const sellerStripeId = sellerConfig?.[0]?.stripe_account_id || null;
    const stripeOnboardingComplete = sellerConfig?.[0]?.stripe_onboarding_complete || false;

    if (!sellerStripeId || !stripeOnboardingComplete) {
      throw new Error("Seller must complete Stripe onboarding to create subscription plans");
    }

    logStep("Creating Stripe product and price in SELLER catalog", { 
      name, 
      price_cents, 
      currency,
      sellerStripeId 
    });

    // Create Stripe product in SELLER's catalog (not platform catalog)
    const product = await stripe.products.create({
      name: name,
      description: description || undefined,
      metadata: {
        creator_id: creator_id,
        type: 'creator_subscription',
        platform: 'sellspay',
      },
    }, {
      stripeAccount: sellerStripeId, // Creates in seller's Stripe catalog
    });
    logStep("Stripe product created in seller catalog", { productId: product.id, sellerStripeId });

    // Create Stripe price in SELLER's catalog (recurring monthly)
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: price_cents,
      currency: (currency || 'USD').toLowerCase(),
      recurring: {
        interval: 'month',
      },
      metadata: {
        creator_id: creator_id,
        type: 'creator_subscription',
      },
    }, {
      stripeAccount: sellerStripeId, // Creates in seller's Stripe catalog
    });
    logStep("Stripe price created", { priceId: price.id });

    // Insert into database with Stripe IDs
    const { data: plan, error: insertError } = await supabaseClient
      .from('creator_subscription_plans')
      .insert({
        creator_id: creator_id,
        name: name,
        description: description || null,
        price_cents: price_cents,
        currency: (currency || 'USD').toUpperCase(),
        stripe_product_id: product.id,
        stripe_price_id: price.id,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      logStep("Database insert error", { error: insertError.message });
      // Try to clean up Stripe resources
      try {
        await stripe.products.update(product.id, { active: false });
      } catch (e) {
        logStep("Failed to deactivate Stripe product", { error: String(e) });
      }
      throw new Error(`Failed to save plan: ${insertError.message}`);
    }

    logStep("Plan created successfully", { planId: plan.id });

    return new Response(
      JSON.stringify({ 
        success: true, 
        plan,
        stripe_product_id: product.id,
        stripe_price_id: price.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
