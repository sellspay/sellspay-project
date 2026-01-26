import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-PAYPAL-ORDER] ${step}${detailsStr}`);
};

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Tier-based platform fee rates (same as Stripe)
const TIER_FEE_RATES: Record<string, number> = {
  'starter': 0.05,
  'pro': 0.03,
  'enterprise': 0,
};
const DEFAULT_FEE_RATE = 0.05;

// PayPal API base URL (use sandbox for testing)
const PAYPAL_API_BASE = "https://api-m.paypal.com"; // Change to api-m.sandbox.paypal.com for testing

async function getPayPalAccessToken(): Promise<string> {
  const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
  const clientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials not configured");
  }

  const auth = btoa(`${clientId}:${clientSecret}`);
  
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get PayPal access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Parse request body
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

    if (!product_id || typeof product_id !== 'string' || !UUID_REGEX.test(product_id)) {
      return new Response(
        JSON.stringify({ error: "product_id must be a valid UUID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Product ID validated", { product_id });

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    let buyerProfileId: string | undefined;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabaseClient.auth.getUser(token);
      if (userData.user) {
        const { data: buyerProfile } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("user_id", userData.user.id)
          .single();
        buyerProfileId = buyerProfile?.id;
        logStep("Buyer authenticated", { profileId: buyerProfileId });
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

    if (!product.creator_id) {
      return new Response(
        JSON.stringify({ error: "Product has no creator" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch creator profile
    const { data: creatorProfile, error: creatorError } = await supabaseAdmin
      .from("profiles")
      .select("id, user_id, subscription_tier")
      .eq("id", product.creator_id)
      .single();

    if (creatorError || !creatorProfile) {
      return new Response(
        JSON.stringify({ error: "Creator profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate fees
    const grossAmount = product.price_cents || 0;
    
    if (grossAmount < 499) {
      return new Response(
        JSON.stringify({ error: "Minimum product price is $4.99" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const creatorTier = creatorProfile.subscription_tier?.toLowerCase() || null;
    const platformFeeRate = creatorTier && TIER_FEE_RATES[creatorTier] !== undefined 
      ? TIER_FEE_RATES[creatorTier] 
      : DEFAULT_FEE_RATE;

    // PayPal fees are approximately 2.89% + $0.49 for standard transactions
    const paypalProcessingFee = Math.round(grossAmount * 0.0289) + 49;
    const platformFee = Math.round(grossAmount * platformFeeRate);
    const totalFees = paypalProcessingFee + platformFee;
    const creatorPayout = grossAmount - totalFees;

    logStep("Fee breakdown", {
      grossAmount,
      paypalProcessingFee,
      platformFee,
      creatorPayout,
    });

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();
    logStep("PayPal access token obtained");

    // Create PayPal order
    const orderData = {
      intent: "CAPTURE",
      purchase_units: [{
        reference_id: product_id,
        description: product.name,
        amount: {
          currency_code: "USD",
          value: (grossAmount / 100).toFixed(2),
        },
        custom_id: JSON.stringify({
          product_id,
          buyer_profile_id: buyerProfileId || "",
          creator_profile_id: creatorProfile.id,
          platform_fee_cents: platformFee,
          creator_payout_cents: creatorPayout,
        }),
      }],
      application_context: {
        brand_name: "Editors Paradise",
        landing_page: "NO_PREFERENCE",
        user_action: "PAY_NOW",
        return_url: `${req.headers.get("origin") || "https://editorsparadise.lovable.app"}/product/${product_id}?paypal=success`,
        cancel_url: `${req.headers.get("origin") || "https://editorsparadise.lovable.app"}/product/${product_id}?paypal=canceled`,
      },
    };

    const orderResponse = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });

    if (!orderResponse.ok) {
      const error = await orderResponse.text();
      logStep("PayPal order creation failed", { error });
      throw new Error(`Failed to create PayPal order: ${error}`);
    }

    const order = await orderResponse.json();
    logStep("PayPal order created", { orderId: order.id });

    // Get approval URL
    const approvalUrl = order.links?.find((link: { rel: string; href: string }) => link.rel === "approve")?.href;

    return new Response(
      JSON.stringify({
        orderId: order.id,
        approvalUrl,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logStep("ERROR", { message });
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
