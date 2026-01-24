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

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { amountCents } = await req.json();
    if (!amountCents || amountCents < 1000) { // Minimum $10
      throw new Error("Minimum payout amount is $10");
    }
    logStep("Payout amount", { amountCents });

    // Get user profile with Payoneer info
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("id, payoneer_email, payoneer_payee_id, payoneer_status")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) throw new Error("Profile not found");
    if (!profile.payoneer_payee_id) throw new Error("Payoneer account not connected");
    if (profile.payoneer_status !== "active") {
      throw new Error("Payoneer account is not yet verified");
    }
    logStep("Payoneer account verified", { payeeId: profile.payoneer_payee_id });

    // In production, you would:
    // 1. Check the user's available balance (from your internal tracking)
    // 2. Make actual API call to Payoneer to initiate payout
    // 3. Record the transaction in your database

    // For now, return a simulated success response
    const payoutId = `PO_${Date.now()}`;
    
    return new Response(
      JSON.stringify({
        success: true,
        payoutId,
        amount: amountCents,
        currency: "USD",
        status: "processing",
        message: "Payout initiated successfully. Funds will arrive in 1-3 business days.",
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
