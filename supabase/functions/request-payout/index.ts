import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[REQUEST-PAYOUT] ${step}${detailsStr}`);
};

const MIN_WITHDRAWAL_CENTS = 2000; // $20 minimum

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
      auth: { persistSession: false },
    });

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { provider, instant } = body as { provider?: string; instant?: boolean };
    logStep("Request parsed", { provider, instant });

    // Get seller profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, is_seller, seller_mode, seller_status")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!profile.is_seller) {
      return new Response(
        JSON.stringify({ error: "Only sellers can request payouts" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Profile found", { profileId: profile.id, sellerMode: profile.seller_mode });

    // Get seller config
    const { data: sellerConfig, error: configError } = await supabaseAdmin.rpc(
      "get_seller_config",
      { p_user_id: user.id }
    );

    if (configError) {
      logStep("Error getting seller config", { error: configError.message });
    }

    const config = sellerConfig?.[0];

    // Get available balance
    const { data: balanceData, error: balanceError } = await supabaseAdmin.rpc(
      "get_seller_wallet_balance",
      { p_seller_id: profile.id }
    );

    if (balanceError) {
      throw new Error(`Failed to get balance: ${balanceError.message}`);
    }

    // Also fetch legacy pending from purchases
    const { data: legacyPurchases } = await supabaseAdmin
      .from("purchases")
      .select("id, creator_payout_cents, product_id")
      .eq("status", "completed")
      .eq("transferred", false)
      .in("product_id", (
        await supabaseAdmin
          .from("products")
          .select("id")
          .eq("creator_id", profile.id)
      ).data?.map(p => p.id) || []);

    const { data: legacyBookings } = await supabaseAdmin
      .from("editor_bookings")
      .select("id, editor_payout_cents")
      .eq("editor_id", profile.id)
      .eq("status", "completed")
      .eq("transferred", false);

    const ledgerAvailable = Number(balanceData?.[0]?.available_cents || 0);
    const legacyPurchaseCents = (legacyPurchases || []).reduce((sum, p) => sum + (p.creator_payout_cents || 0), 0);
    const legacyBookingCents = (legacyBookings || []).reduce((sum, b) => sum + (b.editor_payout_cents || 0), 0);
    
    const totalAvailable = ledgerAvailable + legacyPurchaseCents + legacyBookingCents;

    logStep("Balance calculated", { 
      ledgerAvailable, 
      legacyPurchaseCents, 
      legacyBookingCents, 
      totalAvailable 
    });

    // Check minimum
    if (totalAvailable < MIN_WITHDRAWAL_CENTS) {
      return new Response(
        JSON.stringify({ 
          error: `Minimum withdrawal is $${(MIN_WITHDRAWAL_CENTS / 100).toFixed(2)}. Your available balance is $${(totalAvailable / 100).toFixed(2)}.`,
          available: totalAvailable,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for existing pending payout request
    const { data: existingPayout } = await supabaseAdmin
      .from("payouts")
      .select("id, status")
      .eq("seller_id", profile.id)
      .in("status", ["requested", "approved", "processing"])
      .single();

    if (existingPayout) {
      return new Response(
        JSON.stringify({ 
          error: "You already have a pending payout request. Please wait for it to be processed.",
          existingPayoutId: existingPayout.id,
          existingStatus: existingPayout.status,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine payout provider based on seller mode and request
    const sellerMode = profile.seller_mode || "MOR";
    let payoutProvider = provider?.toUpperCase() || "STRIPE";

    // For MOR sellers, only allow PayPal or Payoneer
    if (sellerMode === "MOR") {
      if (!["PAYPAL", "PAYONEER"].includes(payoutProvider)) {
        // Check what provider is configured
        if (config?.paypal_email) {
          payoutProvider = "PAYPAL";
        } else if (config?.payoneer_payee_id) {
          payoutProvider = "PAYONEER";
        } else {
          return new Response(
            JSON.stringify({ 
              error: "Please connect PayPal or Payoneer to receive payouts.",
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // For CONNECT sellers with Stripe
    if (sellerMode === "CONNECT" && payoutProvider === "STRIPE") {
      const stripeAccountId = config?.stripe_account_id;
      const onboardingComplete = config?.stripe_onboarding_complete;

      if (!stripeAccountId || !onboardingComplete) {
        return new Response(
          JSON.stringify({ error: "Please complete Stripe Connect setup first" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Auto-process Stripe payout immediately
      logStep("Processing Stripe Connect payout", { stripeAccountId });

      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (!stripeKey) {
        throw new Error("STRIPE_SECRET_KEY is not set");
      }

      const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

      // Transfer pending platform earnings to connected account
      if (legacyPurchaseCents + legacyBookingCents > 0) {
        const transfer = await stripe.transfers.create({
          amount: legacyPurchaseCents + legacyBookingCents,
          currency: "usd",
          destination: stripeAccountId,
          description: `Withdrawal: ${(legacyPurchases || []).length} sales, ${(legacyBookings || []).length} bookings`,
        });

        logStep("Transfer created", { transferId: transfer.id });

        // Mark as transferred
        if (legacyPurchases?.length) {
          await supabaseAdmin
            .from("purchases")
            .update({ 
              transferred: true, 
              transferred_at: new Date().toISOString(),
              stripe_transfer_id: transfer.id,
            })
            .in("id", legacyPurchases.map(p => p.id));
        }

        if (legacyBookings?.length) {
          await supabaseAdmin
            .from("editor_bookings")
            .update({ 
              transferred: true, 
              transferred_at: new Date().toISOString(),
              stripe_transfer_id: transfer.id,
            })
            .in("id", legacyBookings.map(b => b.id));
        }
      }

      // Calculate payout amount
      let payoutAmount = totalAvailable;
      let feeAmount = 0;
      if (instant) {
        feeAmount = Math.round(totalAvailable * 0.03);
        payoutAmount = totalAvailable - feeAmount;
      }

      // Create payout to bank
      const payout = await stripe.payouts.create(
        {
          amount: payoutAmount,
          currency: "usd",
          method: instant ? "instant" : "standard",
        },
        { stripeAccount: stripeAccountId }
      );

      logStep("Stripe payout created", { payoutId: payout.id, amount: payout.amount });

      // Create payout record for tracking
      await supabaseAdmin.from("payouts").insert({
        seller_id: profile.id,
        amount_cents: payoutAmount,
        provider_type: "STRIPE",
        status: "sent",
        external_reference: payout.id,
        sent_at: new Date().toISOString(),
      });

      return new Response(
        JSON.stringify({
          success: true,
          mode: "auto",
          provider: "STRIPE",
          payoutId: payout.id,
          amount: payoutAmount,
          fee: feeAmount,
          estimatedArrival: instant ? "Instant" : "1-3 business days",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For MOR sellers (or CONNECT sellers requesting non-Stripe payout)
    // Create payout request for admin approval
    logStep("Creating payout request for admin approval", { 
      provider: payoutProvider, 
      amount: totalAvailable 
    });

    const { data: payoutRequest, error: insertError } = await supabaseAdmin
      .from("payouts")
      .insert({
        seller_id: profile.id,
        amount_cents: totalAvailable,
        provider_type: payoutProvider,
        status: "requested",
        requested_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create payout request: ${insertError.message}`);
    }

    logStep("Payout request created", { payoutId: payoutRequest.id });

    // Create admin notification
    await supabaseAdmin.from("admin_notifications").insert({
      type: "payout_request",
      message: `New payout request: $${(totalAvailable / 100).toFixed(2)} via ${payoutProvider}`,
      redirect_url: "/admin?tab=payouts",
    });

    return new Response(
      JSON.stringify({
        success: true,
        mode: "pending_approval",
        provider: payoutProvider,
        payoutId: payoutRequest.id,
        amount: totalAvailable,
        status: "requested",
        message: `Your payout request for $${(totalAvailable / 100).toFixed(2)} has been submitted and is pending admin approval. You'll be notified once it's processed.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
