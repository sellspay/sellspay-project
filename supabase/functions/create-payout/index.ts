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

// Minimum withdrawal in cents ($10)
const MIN_WITHDRAWAL_CENTS = 1000;

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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create Supabase client
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

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
        JSON.stringify({ error: "Please connect your Stripe account first to withdraw funds" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Profile found", { profileId: profile.id, stripeAccountId });

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get pending earnings from product sales (not yet transferred)
    const { data: pendingPurchases, error: purchasesError } = await supabaseClient
      .from("purchases")
      .select(`
        id,
        creator_payout_cents,
        product_id,
        products!inner(creator_id)
      `)
      .eq("products.creator_id", profile.id)
      .eq("status", "completed")
      .eq("transferred", false);

    if (purchasesError) {
      logStep("Error fetching pending purchases", { error: purchasesError.message });
    }

    // Get pending earnings from editor bookings (not yet transferred)
    const { data: pendingBookings, error: bookingsError } = await supabaseClient
      .from("editor_bookings")
      .select("id, editor_payout_cents")
      .eq("editor_id", profile.id)
      .eq("status", "completed")
      .eq("transferred", false);

    if (bookingsError) {
      logStep("Error fetching pending bookings", { error: bookingsError.message });
    }

    // Calculate total pending earnings from platform-held funds
    const pendingProductEarnings = (pendingPurchases || []).reduce(
      (sum, p) => sum + (p.creator_payout_cents || 0), 0
    );
    const pendingBookingEarnings = (pendingBookings || []).reduce(
      (sum, b) => sum + (b.editor_payout_cents || 0), 0
    );
    const totalPendingEarnings = pendingProductEarnings + pendingBookingEarnings;

    logStep("Pending earnings calculated", {
      pendingProductEarnings,
      pendingBookingEarnings,
      totalPendingEarnings,
      pendingPurchaseCount: (pendingPurchases || []).length,
      pendingBookingCount: (pendingBookings || []).length,
    });

    // Also get the connected account's available balance (from direct transfers)
    let stripeBalance = 0;
    try {
      const balance = await stripe.balance.retrieve({
        stripeAccount: stripeAccountId,
      });
      stripeBalance = balance.available.reduce((acc: number, b: Stripe.Balance.Available) => {
        if (b.currency === "usd") return acc + b.amount;
        return acc;
      }, 0);
      logStep("Stripe balance retrieved", { stripeBalance });
    } catch (err) {
      logStep("Could not retrieve Stripe balance", { error: err instanceof Error ? err.message : String(err) });
    }

    // Total available: pending platform earnings + Stripe account balance
    const totalAvailable = totalPendingEarnings + stripeBalance;

    if (totalAvailable < MIN_WITHDRAWAL_CENTS) {
      return new Response(
        JSON.stringify({ 
          error: `Minimum withdrawal is $${(MIN_WITHDRAWAL_CENTS / 100).toFixed(2)}. Your available balance is $${(totalAvailable / 100).toFixed(2)}.`,
          availableBalance: totalAvailable,
          pendingEarnings: totalPendingEarnings,
          stripeBalance: stripeBalance,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate payout amount after fee (if instant)
    let payoutAmount = totalAvailable;
    let feeAmount = 0;
    
    if (instant) {
      feeAmount = Math.round(totalAvailable * 0.03); // 3% instant fee
      payoutAmount = totalAvailable - feeAmount;
    }

    logStep("Payout calculation", { 
      totalAvailable,
      pendingEarnings: totalPendingEarnings,
      stripeBalance,
      feeAmount, 
      payoutAmount, 
      instant 
    });

    // If there are pending earnings from platform, transfer them to the connected account first
    if (totalPendingEarnings > 0) {
      logStep("Transferring pending earnings to connected account", {
        amount: totalPendingEarnings,
        destination: stripeAccountId,
      });

      const transfer = await stripe.transfers.create({
        amount: totalPendingEarnings,
        currency: "usd",
        destination: stripeAccountId,
        description: `Withdrawal: ${(pendingPurchases || []).length} sales, ${(pendingBookings || []).length} bookings`,
      });

      logStep("Transfer created", { transferId: transfer.id, amount: transfer.amount });

      // Mark purchases as transferred
      if (pendingPurchases && pendingPurchases.length > 0) {
        const purchaseIds = pendingPurchases.map(p => p.id);
        const { error: updateError } = await supabaseClient
          .from("purchases")
          .update({ 
            transferred: true, 
            transferred_at: new Date().toISOString(),
            stripe_transfer_id: transfer.id,
          })
          .in("id", purchaseIds);

        if (updateError) {
          logStep("Warning: Failed to mark purchases as transferred", { error: updateError.message });
        } else {
          logStep("Purchases marked as transferred", { count: purchaseIds.length });
        }
      }

      // Mark bookings as transferred
      if (pendingBookings && pendingBookings.length > 0) {
        const bookingIds = pendingBookings.map(b => b.id);
        const { error: updateError } = await supabaseClient
          .from("editor_bookings")
          .update({ 
            transferred: true, 
            transferred_at: new Date().toISOString(),
            stripe_transfer_id: transfer.id,
          })
          .in("id", bookingIds);

        if (updateError) {
          logStep("Warning: Failed to mark bookings as transferred", { error: updateError.message });
        } else {
          logStep("Bookings marked as transferred", { count: bookingIds.length });
        }
      }
    }

    // Now create payout from connected account to their bank
    const payout = await stripe.payouts.create(
      {
        amount: payoutAmount,
        currency: "usd",
        method: instant ? "instant" : "standard",
      },
      {
        stripeAccount: stripeAccountId,
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
        details: {
          pendingEarningsTransferred: totalPendingEarnings,
          stripeBalanceWithdrawn: stripeBalance,
        },
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