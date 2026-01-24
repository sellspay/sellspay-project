import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[REGISTER-PAYONEER] ${step}${detailsStr}`);
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
          error: "Payoneer integration is not yet configured. Please contact support.",
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

    const { payoneerEmail } = await req.json();
    if (!payoneerEmail) throw new Error("Payoneer email is required");
    logStep("Payoneer email provided", { payoneerEmail });

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("id, full_name, is_seller")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) throw new Error("Profile not found");
    if (!profile.is_seller) throw new Error("Only sellers can register with Payoneer");
    logStep("Profile found", { profileId: profile.id });

    // Generate a unique payee ID
    const payeeId = `EP_${profile.id.substring(0, 8).toUpperCase()}`;
    logStep("Generated payee ID", { payeeId });

    // In production, you would make actual API calls to Payoneer here
    // For now, we'll simulate the registration and store the info
    // This allows the UI to be built and tested

    // Update profile with Payoneer info
    const { error: updateError } = await supabaseClient
      .from("profiles")
      .update({
        payoneer_email: payoneerEmail,
        payoneer_payee_id: payeeId,
        payoneer_status: "pending", // Will be 'active' after Payoneer verification
      })
      .eq("id", profile.id);

    if (updateError) throw updateError;
    logStep("Profile updated with Payoneer info");

    return new Response(
      JSON.stringify({
        success: true,
        payeeId,
        status: "pending",
        message: "Payoneer registration initiated. Verification in progress.",
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
