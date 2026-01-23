import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[DEDUCT-CREDIT] ${step}${detailsStr}`);
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
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) {
      throw new Error(`Authentication error: ${userError.message}`);
    }
    
    const user = userData.user;
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    logStep("User authenticated", { userId: user.id });

    const { tool_id } = await req.json();
    if (!tool_id) {
      throw new Error("tool_id is required");
    }

    logStep("Deducting credit for tool", { tool_id });

    // Get current credit balance
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("id, credit_balance")
      .eq("user_id", user.id)
      .single();

    if (profileError) {
      throw new Error(`Failed to fetch profile: ${profileError.message}`);
    }

    const currentBalance = profile?.credit_balance ?? 0;
    logStep("Current balance", { currentBalance });

    if (currentBalance < 1) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Insufficient credits",
          credit_balance: currentBalance 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Deduct 1 credit
    const newBalance = currentBalance - 1;
    const { error: updateError } = await supabaseClient
      .from("profiles")
      .update({ credit_balance: newBalance })
      .eq("user_id", user.id);

    if (updateError) {
      throw new Error(`Failed to update credit balance: ${updateError.message}`);
    }

    logStep("Credit deducted", { newBalance });

    // Record the transaction
    const { error: transactionError } = await supabaseClient
      .from("credit_transactions")
      .insert({
        user_id: profile.id,
        type: "usage",
        amount: -1,
        tool_id,
        description: `Used ${tool_id}`,
      });

    if (transactionError) {
      logStep("Warning: Failed to record transaction", { error: transactionError.message });
    }

    return new Response(
      JSON.stringify({
        success: true,
        credit_balance: newBalance,
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
