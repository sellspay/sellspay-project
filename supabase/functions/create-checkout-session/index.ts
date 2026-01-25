import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Base fee constants
const STRIPE_PERCENT_FEE = 0.029; // 2.9% Stripe fee
const STRIPE_FIXED_FEE_CENTS = 30; // $0.30 Stripe fixed fee

// Tier-based platform fee rates
const TIER_FEE_RATES: Record<string, number> = {
  'starter': 0.05, // 5%
  'pro': 0.03,     // 3%
  'enterprise': 0, // 0%
};
const DEFAULT_FEE_RATE = 0.05; // 5% for no subscription

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

    // Use anon key for user auth
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    // Use service role for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Parse and validate request body
    let body: { product_id?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { product_id } = body;
    
    // Validate product_id exists and is a valid UUID
    if (!product_id) {
      return new Response(
        JSON.stringify({ error: "product_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (typeof product_id !== 'string' || !UUID_REGEX.test(product_id)) {
      return new Response(
        JSON.stringify({ error: "product_id must be a valid UUID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    logStep("Product ID validated", { product_id });

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    let buyerEmail: string | undefined;
    let buyerProfileId: string | undefined;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabaseClient.auth.getUser(token);
      if (userData.user?.email) {
        buyerEmail = userData.user.email;
        // Get buyer profile ID
        const { data: buyerProfile } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("user_id", userData.user.id)
          .single();
        buyerProfileId = buyerProfile?.id;
        logStep("Buyer authenticated", { email: buyerEmail, profileId: buyerProfileId });
      }
    }

    // Fetch product details
    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("id, name, price_cents, cover_image_url, creator_id")
      .eq("id", product_id)
      .single();

    if (productError || !product) {
      logStep("Product not found", { error: productError?.message });
      return new Response(
        JSON.stringify({ error: "Product not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    logStep("Product found", { name: product.name, price: product.price_cents, creatorId: product.creator_id });

    if (!product.creator_id) {
      return new Response(
        JSON.stringify({ error: "Product has no creator" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch creator profile separately with subscription tier
    const { data: creatorProfile, error: creatorError } = await supabaseAdmin
      .from("profiles")
      .select("id, stripe_account_id, stripe_onboarding_complete, subscription_tier")
      .eq("id", product.creator_id)
      .single();

    if (creatorError || !creatorProfile) {
      logStep("Creator profile not found", { error: creatorError?.message });
      return new Response(
        JSON.stringify({ error: "Creator profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!creatorProfile.stripe_account_id || !creatorProfile.stripe_onboarding_complete) {
      logStep("Creator not onboarded", { 
        hasAccount: !!creatorProfile.stripe_account_id, 
        complete: creatorProfile.stripe_onboarding_complete 
      });
      return new Response(
        JSON.stringify({ error: "Creator has not completed Stripe onboarding" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Determine platform fee rate based on creator's subscription tier
    const creatorTier = creatorProfile.subscription_tier?.toLowerCase() || null;
    const platformFeeRate = creatorTier && TIER_FEE_RATES[creatorTier] !== undefined 
      ? TIER_FEE_RATES[creatorTier] 
      : DEFAULT_FEE_RATE;
    
    logStep("Creator verified", { 
      stripeAccountId: creatorProfile.stripe_account_id,
      subscriptionTier: creatorTier,
      platformFeeRate: `${platformFeeRate * 100}%`
    });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Calculate fees
    const grossAmount = product.price_cents || 0;
    
    // Validate minimum price ($4.99 = 499 cents)
    if (grossAmount < 499) {
      return new Response(
        JSON.stringify({ error: "Minimum product price is $4.99" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Validate amount is reasonable (max $10,000)
    if (grossAmount > 1000000) {
      return new Response(
        JSON.stringify({ error: "Invalid product price" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Calculate Stripe's processing fee (2.9% + $0.30)
    const stripeProcessingFee = Math.round(grossAmount * STRIPE_PERCENT_FEE) + STRIPE_FIXED_FEE_CENTS;
    
    // Calculate platform fee based on creator's tier
    const platformFee = Math.round(grossAmount * platformFeeRate);
    
    // Total fees: Stripe processing + Platform fee
    const totalApplicationFee = stripeProcessingFee + platformFee;
    
    // Creator receives: gross - all fees
    const creatorPayout = grossAmount - totalApplicationFee;
    
    // Ensure creator payout is positive
    if (creatorPayout < 0) {
      return new Response(
        JSON.stringify({ error: "Product price too low to cover processing fees" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    logStep("Fee breakdown", { 
      grossAmount: grossAmount,
      stripeProcessingFee: stripeProcessingFee,
      platformFee: platformFee,
      platformFeeRate: `${platformFeeRate * 100}%`,
      creatorTier: creatorTier || "none",
      totalApplicationFee: totalApplicationFee,
      creatorPayout: creatorPayout,
    });

    // Check if customer exists
    let customerId: string | undefined;
    if (buyerEmail) {
      const customers = await stripe.customers.list({ email: buyerEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Existing customer found", { customerId });
      }
    }

    const origin = req.headers.get("origin") || "https://editorsparadise.org";

    // Create checkout session with Stripe Connect
    logStep("Creating checkout with Stripe Connect", {
      destinationAccount: creatorProfile.stripe_account_id,
      applicationFee: totalApplicationFee,
      creatorGets: creatorPayout,
      platformKeeps: platformFee,
      stripeFee: stripeProcessingFee,
    });

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : buyerEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: product.name,
              images: product.cover_image_url ? [product.cover_image_url] : [],
            },
            unit_amount: grossAmount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      payment_intent_data: {
        application_fee_amount: totalApplicationFee,
        transfer_data: {
          destination: creatorProfile.stripe_account_id,
        },
      },
      success_url: `${origin}/product/${product_id}?purchase=success`,
      cancel_url: `${origin}/product/${product_id}?purchase=canceled`,
      metadata: {
        product_id: product_id,
        buyer_profile_id: buyerProfileId || "",
        creator_profile_id: creatorProfile.id,
        gross_amount_cents: grossAmount.toString(),
        stripe_fee_cents: stripeProcessingFee.toString(),
        platform_fee_cents: platformFee.toString(),
        platform_fee_rate: platformFeeRate.toString(),
        creator_tier: creatorTier || "none",
        creator_payout_cents: creatorPayout.toString(),
      },
    });

    logStep("Checkout session created successfully", { 
      sessionId: session.id, 
      url: session.url,
      grossCharged: grossAmount,
      applicationFee: totalApplicationFee,
      creatorPayout: creatorPayout,
      creatorTier: creatorTier || "none",
      destinationAccount: creatorProfile.stripe_account_id,
    });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
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