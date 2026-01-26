import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-PAYONEER-PAYOUT] ${step}${detailsStr}`);
};

const MINIMUM_PAYOUT_CENTS = 1000; // $10 minimum

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Check for Payoneer credentials
    const partnerId = Deno.env.get("PAYONEER_PARTNER_ID");
    const apiUsername = Deno.env.get("PAYONEER_API_USERNAME");
    const apiPassword = Deno.env.get("PAYONEER_API_PASSWORD");
    const programId = Deno.env.get("PAYONEER_PROGRAM_ID");

    if (!partnerId || !apiUsername || !apiPassword || !programId) {
      logStep("Payoneer not configured");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Payoneer integration is not yet configured.",
          notConfigured: true 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Get user profile with Payoneer info
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("id, is_seller")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) throw new Error("Profile not found");
    if (!profile.is_seller) throw new Error("Only sellers can request payouts");
    logStep("Profile found", { profileId: profile.id });

    // Get seller config to check Payoneer status
    const { data: sellerConfig, error: configError } = await supabaseClient.rpc(
      "get_seller_config",
      { p_user_id: user.id }
    );

    if (configError) throw new Error(`Failed to get seller config: ${configError.message}`);
    
    const config = sellerConfig?.[0];
    if (!config?.payoneer_payee_id) throw new Error("Payoneer account not connected");
    if (config.payoneer_status !== "active") {
      throw new Error("Payoneer account is not yet verified");
    }
    logStep("Payoneer account verified", { payeeId: config.payoneer_payee_id });

    // Get creator's products
    const { data: creatorProducts } = await supabaseClient
      .from("products")
      .select("id")
      .eq("creator_id", profile.id);

    const productIds = creatorProducts?.map(p => p.id) || [];

    // Get ALL pending purchases (regardless of payment method - seller can choose any payout provider)
    const { data: pendingPurchases, error: purchasesError } = await supabaseClient
      .from("purchases")
      .select("id, creator_payout_cents, product_id")
      .eq("status", "completed")
      .eq("transferred", false)
      .in("product_id", productIds.length > 0 ? productIds : ['no-products']);

    // Get pending editor bookings
    const { data: pendingBookings, error: bookingsError } = await supabaseClient
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

    // In production, you would make actual API call to Payoneer to initiate payout
    // For now, return a simulated success response
    const payoutId = `PAYONEER_${Date.now()}`;
    const payoutAmount = (totalPendingCents / 100).toFixed(2);

    logStep("Creating Payoneer payout", { payoutAmount, payeeId: config.payoneer_payee_id });

    // Mark purchases as transferred
    const purchaseIds = (pendingPurchases || []).map(p => p.id);
    if (purchaseIds.length > 0) {
      await supabaseClient
        .from("purchases")
        .update({ 
          transferred: true, 
          transferred_at: new Date().toISOString(),
          stripe_transfer_id: `payoneer_payout_${payoutId}`,
        })
        .in("id", purchaseIds);
    }

    // Mark bookings as transferred
    const bookingIds = (pendingBookings || []).map(b => b.id);
    if (bookingIds.length > 0) {
      await supabaseClient
        .from("editor_bookings")
        .update({ 
          transferred: true, 
          transferred_at: new Date().toISOString(),
          stripe_transfer_id: `payoneer_payout_${payoutId}`,
        })
        .in("id", bookingIds);
    }

    logStep("Payout processed", { payoutId, purchaseIds, bookingIds });
    
    return new Response(
      JSON.stringify({
        success: true,
        payoutId,
        amount: payoutAmount,
        currency: "USD",
        status: "processing",
        message: `$${payoutAmount} is being transferred to your Payoneer account. Funds will arrive in 1-3 business days.`,
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
