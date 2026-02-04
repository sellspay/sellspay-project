import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[GET-WALLET-BALANCE] ${step}${detailsStr}`);
};

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

    // Get user from auth header
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

    // Get wallet balance using the database function
    const { data: balanceData, error: balanceError } = await supabaseAdmin.rpc(
      "get_seller_wallet_balance",
      { p_seller_id: profile.id }
    );

    if (balanceError) {
      logStep("Balance query error", { error: balanceError.message });
      throw new Error(`Failed to get balance: ${balanceError.message}`);
    }

    const balance = balanceData?.[0] || {
      available_cents: 0,
      pending_cents: 0,
      locked_cents: 0,
      total_earned_cents: 0,
      total_withdrawn_cents: 0,
    };

    // Also fetch legacy pending earnings from purchases table for backward compatibility
    const { data: legacyPurchases } = await supabaseAdmin
      .from("purchases")
      .select("creator_payout_cents")
      .eq("status", "completed")
      .eq("transferred", false)
      .in("product_id", (
        await supabaseAdmin
          .from("products")
          .select("id")
          .eq("creator_id", profile.id)
      ).data?.map(p => p.id) || []);

    const legacyPendingCents = (legacyPurchases || []).reduce(
      (sum, p) => sum + (p.creator_payout_cents || 0),
      0
    );

    // Also fetch legacy pending from editor bookings
    const { data: legacyBookings } = await supabaseAdmin
      .from("editor_bookings")
      .select("editor_payout_cents")
      .eq("editor_id", profile.id)
      .eq("status", "completed")
      .eq("transferred", false);

    const legacyBookingsCents = (legacyBookings || []).reduce(
      (sum, b) => sum + (b.editor_payout_cents || 0),
      0
    );

    // Combine legacy and new ledger balances
    const totalAvailable = Number(balance.available_cents) + legacyPendingCents + legacyBookingsCents;
    const totalPending = Number(balance.pending_cents);
    const totalLocked = Number(balance.locked_cents);

    const result = {
      available_cents: totalAvailable,
      pending_cents: totalPending,
      locked_cents: totalLocked,
      total_earned_cents: Number(balance.total_earned_cents),
      total_withdrawn_cents: Number(balance.total_withdrawn_cents),
      seller_mode: profile.seller_mode,
      seller_status: profile.seller_status,
      // Formatted for display
      available_usd: (totalAvailable / 100).toFixed(2),
      pending_usd: (totalPending / 100).toFixed(2),
      locked_usd: (totalLocked / 100).toFixed(2),
    };

    logStep("Balance retrieved", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logStep("ERROR", { message });
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
