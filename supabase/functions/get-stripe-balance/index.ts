import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-STRIPE-BALANCE] ${step}${detailsStr}`);
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

    // Authenticate user - return safe defaults if not authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          connected: false,
          availableBalance: 0,
          pendingBalance: 0,
          pendingEarnings: 0,
          stripeBalance: 0,
          breakdown: { productEarnings: 0, bookingEarnings: 0 },
          needsOnboarding: false,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({
          connected: false,
          availableBalance: 0,
          pendingBalance: 0,
          pendingEarnings: 0,
          stripeBalance: 0,
          breakdown: { productEarnings: 0, bookingEarnings: 0 },
          needsOnboarding: false,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

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

    logStep("Profile found", { profileId: profile.id, stripeAccountId, onboardingComplete });

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get pending earnings from product sales (not yet transferred to connected account)
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

    // If user has no Stripe connected, return pending earnings as available balance
    if (!stripeAccountId || !onboardingComplete) {
      return new Response(
        JSON.stringify({ 
          connected: false,
          availableBalance: totalPendingEarnings, // Show pending earnings
          pendingBalance: 0,
          pendingEarnings: totalPendingEarnings,
          stripeBalance: 0,
          breakdown: {
            productEarnings: pendingProductEarnings,
            bookingEarnings: pendingBookingEarnings,
          },
          needsOnboarding: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Get the connected account's balance
    let stripeAvailableBalance = 0;
    let stripePendingBalance = 0;
    
    try {
      const balance = await stripe.balance.retrieve({
        stripeAccount: stripeAccountId,
      });

      logStep("Balance retrieved", { available: balance.available, pending: balance.pending });

      // Calculate balances (USD only for simplicity)
      stripeAvailableBalance = balance.available.reduce((acc: number, b: Stripe.Balance.Available) => {
        if (b.currency === "usd") return acc + b.amount;
        return acc;
      }, 0);

      stripePendingBalance = balance.pending.reduce((acc: number, b: Stripe.Balance.Pending) => {
        if (b.currency === "usd") return acc + b.amount;
        return acc;
      }, 0);
    } catch (stripeErr) {
      logStep("Could not retrieve Stripe balance", { error: stripeErr instanceof Error ? stripeErr.message : String(stripeErr) });
    }

    // Total available = pending platform earnings + Stripe available balance
    const totalAvailableBalance = totalPendingEarnings + stripeAvailableBalance;
    // Total pending = Stripe pending (7-day hold on direct transfers)
    const totalPendingBalance = stripePendingBalance;

    logStep("Final balance calculated", {
      totalAvailableBalance,
      totalPendingBalance,
      stripeAvailableBalance,
      stripePendingBalance,
      platformPendingEarnings: totalPendingEarnings,
    });

    return new Response(
      JSON.stringify({
        connected: true,
        availableBalance: totalAvailableBalance,
        pendingBalance: totalPendingBalance,
        pendingEarnings: totalPendingEarnings,
        stripeBalance: stripeAvailableBalance,
        breakdown: {
          productEarnings: pendingProductEarnings,
          bookingEarnings: pendingBookingEarnings,
          stripeAvailable: stripeAvailableBalance,
          stripePending: stripePendingBalance,
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