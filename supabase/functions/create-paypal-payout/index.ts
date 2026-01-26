import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-PAYPAL-PAYOUT] ${step}${detailsStr}`);
};

const PAYPAL_API_BASE = "https://api-m.paypal.com";
const MINIMUM_PAYOUT_CENTS = 1000; // $10 minimum

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

    const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
    const clientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ success: false, error: "PayPal not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, is_seller")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) throw new Error("Profile not found");
    if (!profile.is_seller) throw new Error("Only sellers can request payouts");

    // Get seller config to get PayPal email
    const { data: sellerConfig, error: configError } = await supabaseAdmin.rpc(
      "get_seller_config",
      { p_user_id: user.id }
    );

    if (configError) throw new Error(`Failed to get seller config: ${configError.message}`);
    
    const config = sellerConfig?.[0];
    const paypalEmail = config?.paypal_email;

    if (!paypalEmail) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Please connect your PayPal account first" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    logStep("PayPal email found", { paypalEmail });

    // Get creator's products first
    const { data: creatorProducts } = await supabaseAdmin
      .from("products")
      .select("id")
      .eq("creator_id", profile.id);

    const productIds = creatorProducts?.map(p => p.id) || [];

    if (productIds.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No products found for this seller" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Get ALL pending purchases for these products (regardless of payment method)
    // Sellers can choose to withdraw via PayPal even if buyer paid via Stripe
    const { data: pendingPurchases, error: purchasesError } = await supabaseAdmin
      .from("purchases")
      .select("id, creator_payout_cents, product_id")
      .eq("status", "completed")
      .eq("transferred", false)
      .in("product_id", productIds);

    // Also get pending editor bookings
    const { data: pendingBookings, error: bookingsError } = await supabaseAdmin
      .from("editor_bookings")
      .select("id, editor_payout_cents")
      .eq("editor_id", profile.id)
      .eq("status", "completed")
      .eq("transferred", false);

    if (purchasesError) {
      logStep("Error fetching purchases", { error: purchasesError.message });
    }
    if (bookingsError) {
      logStep("Error fetching bookings", { error: bookingsError.message });
    }

    // Calculate total pending earnings from products and bookings
    const productEarnings = (pendingPurchases || []).reduce(
      (sum: number, p) => sum + (p.creator_payout_cents || 0), 
      0
    );
    const bookingEarnings = (pendingBookings || []).reduce(
      (sum: number, b) => sum + (b.editor_payout_cents || 0), 
      0
    );
    const totalPendingCents = productEarnings + bookingEarnings;

    logStep("Pending earnings calculated", { 
      totalPendingCents, 
      productEarnings,
      bookingEarnings,
      purchaseCount: (pendingPurchases || []).length,
      bookingCount: (pendingBookings || []).length 
    });

    if (totalPendingCents < MINIMUM_PAYOUT_CENTS) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Minimum payout is $${MINIMUM_PAYOUT_CENTS / 100}. You have $${(totalPendingCents / 100).toFixed(2)} pending.` 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Create PayPal payout
    const accessToken = await getPayPalAccessToken();
    const payoutAmount = (totalPendingCents / 100).toFixed(2);
    const senderBatchId = `EP_${profile.id.substring(0, 8)}_${Date.now()}`;

    const payoutData = {
      sender_batch_header: {
        sender_batch_id: senderBatchId,
        email_subject: "You have a payout from Editors Paradise!",
        email_message: "Your earnings have been transferred to your PayPal account.",
      },
      items: [{
        recipient_type: "EMAIL",
        amount: {
          value: payoutAmount,
          currency: "USD",
        },
        receiver: paypalEmail,
        note: "Editors Paradise creator earnings",
        sender_item_id: `EP_PAYOUT_${Date.now()}`,
      }],
    };

    logStep("Creating PayPal payout", { payoutAmount, paypalEmail });

    const payoutResponse = await fetch(`${PAYPAL_API_BASE}/v1/payments/payouts`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payoutData),
    });

    if (!payoutResponse.ok) {
      const error = await payoutResponse.text();
      logStep("Payout failed", { error });
      throw new Error(`PayPal payout failed: ${error}`);
    }

    const payoutResult = await payoutResponse.json();
    logStep("Payout created", { batchId: payoutResult.batch_header?.payout_batch_id });

    // Mark purchases as transferred
    const purchaseIds = (pendingPurchases || []).map(p => p.id);
    if (purchaseIds.length > 0) {
      await supabaseAdmin
        .from("purchases")
        .update({ 
          transferred: true, 
          transferred_at: new Date().toISOString(),
          stripe_transfer_id: `paypal_payout_${payoutResult.batch_header?.payout_batch_id}`,
        })
        .in("id", purchaseIds);
    }

    // Mark bookings as transferred
    const bookingIds = (pendingBookings || []).map(b => b.id);
    if (bookingIds.length > 0) {
      await supabaseAdmin
        .from("editor_bookings")
        .update({ 
          transferred: true, 
          transferred_at: new Date().toISOString(),
          stripe_transfer_id: `paypal_payout_${payoutResult.batch_header?.payout_batch_id}`,
        })
        .in("id", bookingIds);
    }

    return new Response(
      JSON.stringify({
        success: true,
        amount: payoutAmount,
        batchId: payoutResult.batch_header?.payout_batch_id,
        message: `$${payoutAmount} is being transferred to ${paypalEmail}`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
