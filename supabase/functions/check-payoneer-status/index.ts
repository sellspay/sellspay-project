import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CHECK-PAYONEER-STATUS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

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

    // Get user profile with Payoneer info
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("id, payoneer_email, payoneer_payee_id, payoneer_status, preferred_payout_method")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) throw new Error("Profile not found");
    logStep("Profile found", { profileId: profile.id });

    // Check if Payoneer is configured
    const payoneerConfigured = !!(
      Deno.env.get("PAYONEER_PARTNER_ID") &&
      Deno.env.get("PAYONEER_API_USERNAME") &&
      Deno.env.get("PAYONEER_API_PASSWORD") &&
      Deno.env.get("PAYONEER_PROGRAM_ID")
    );

    return new Response(
      JSON.stringify({
        success: true,
        payoneerConfigured,
        payoneerEmail: profile.payoneer_email,
        payoneerPayeeId: profile.payoneer_payee_id,
        payoneerStatus: profile.payoneer_status,
        preferredPayoutMethod: profile.preferred_payout_method || "stripe",
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
