import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CAPTURE-PAYPAL-ORDER] ${step}${detailsStr}`);
};

const PAYPAL_API_BASE = "https://api-m.paypal.com";

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
    throw new Error("Failed to get PayPal access token");
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
    const { order_id } = await req.json();

    if (!order_id) {
      return new Response(
        JSON.stringify({ error: "order_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Order ID received", { order_id });

    // Get buyer from auth
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
      }
    }

    // Get PayPal access token and capture the order
    const accessToken = await getPayPalAccessToken();

    const captureResponse = await fetch(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${order_id}/capture`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!captureResponse.ok) {
      const error = await captureResponse.text();
      logStep("Capture failed", { error });
      throw new Error(`Failed to capture PayPal order: ${error}`);
    }

    const captureData = await captureResponse.json();
    logStep("Order captured", { status: captureData.status });

    if (captureData.status !== "COMPLETED") {
      return new Response(
        JSON.stringify({ error: "Payment not completed", status: captureData.status }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse custom data from the order
    const purchaseUnit = captureData.purchase_units?.[0];
    const customId = purchaseUnit?.custom_id;
    let purchaseData: {
      product_id?: string;
      buyer_profile_id?: string;
      creator_profile_id?: string;
      platform_fee_cents?: number;
      creator_payout_cents?: number;
    } = {};

    try {
      purchaseData = JSON.parse(customId || "{}");
    } catch {
      logStep("Failed to parse custom_id", { customId });
    }

    const captureAmount = purchaseUnit?.payments?.captures?.[0]?.amount?.value;
    const amountCents = Math.round(parseFloat(captureAmount || "0") * 100);

    // Record the purchase
    const { error: purchaseError } = await supabaseAdmin
      .from("purchases")
      .insert({
        product_id: purchaseData.product_id,
        buyer_id: buyerProfileId || purchaseData.buyer_profile_id,
        amount_cents: amountCents,
        platform_fee_cents: purchaseData.platform_fee_cents || 0,
        creator_payout_cents: purchaseData.creator_payout_cents || 0,
        status: "completed",
        stripe_payment_intent_id: `paypal_${order_id}`, // Use PayPal order ID
        transferred: false, // Creator will withdraw via PayPal payout
      });

    if (purchaseError) {
      logStep("Failed to record purchase", { error: purchaseError.message });
      // Don't fail the whole request, payment is already captured
    } else {
      logStep("Purchase recorded successfully");
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId: order_id,
        status: captureData.status,
        productId: purchaseData.product_id,
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
