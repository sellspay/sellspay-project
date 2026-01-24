import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-CREDITS] ${step}${detailsStr}`);
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
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      logStep("No auth header - returning default for unauthenticated user");
      return new Response(
        JSON.stringify({ credit_balance: 0, authenticated: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      logStep("Auth failed - returning default for unauthenticated user");
      return new Response(
        JSON.stringify({ credit_balance: 0, authenticated: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }
    
    const user = userData.user;
    
    logStep("User authenticated", { userId: user.id });

    // Get credit balance from profiles
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("credit_balance")
      .eq("user_id", user.id)
      .single();

    if (profileError) {
      logStep("Error fetching profile", { error: profileError.message });
      throw new Error(`Failed to fetch profile: ${profileError.message}`);
    }

    const creditBalance = profile?.credit_balance ?? 0;
    logStep("Credit balance fetched", { creditBalance });

    return new Response(
      JSON.stringify({
        credit_balance: creditBalance,
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
