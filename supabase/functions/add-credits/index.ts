import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADD-CREDITS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

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
    if (!user?.email) {
      throw new Error("User not authenticated");
    }
    
    logStep("User authenticated", { userId: user.id });

    const { session_id } = await req.json();
    if (!session_id) {
      throw new Error("session_id is required");
    }

    logStep("Verifying session", { session_id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Verify the checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    logStep("Session verified", { 
      payment_status: session.payment_status,
      metadata: session.metadata 
    });

    const credits = parseInt(session.metadata?.credits || "0", 10);
    const packageId = session.metadata?.package_id;

    if (!credits || credits <= 0) {
      throw new Error("Invalid credits in session metadata");
    }

    // Check if this session was already processed
    const { data: existingTransaction } = await supabaseClient
      .from("credit_transactions")
      .select("id")
      .eq("stripe_session_id", session_id)
      .single();

    if (existingTransaction) {
      logStep("Session already processed", { transactionId: existingTransaction.id });
      
      // Return current balance
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("credit_balance")
        .eq("user_id", user.id)
        .single();

      return new Response(
        JSON.stringify({ 
          success: true, 
          already_processed: true,
          credit_balance: profile?.credit_balance ?? 0 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Get current credit balance and profile ID
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("id, credit_balance")
      .eq("user_id", user.id)
      .single();

    if (profileError) {
      throw new Error(`Failed to fetch profile: ${profileError.message}`);
    }

    const currentBalance = profile?.credit_balance ?? 0;
    const newBalance = currentBalance + credits;

    logStep("Adding credits", { currentBalance, credits, newBalance });

    // Update credit balance
    const { error: updateError } = await supabaseClient
      .from("profiles")
      .update({ credit_balance: newBalance })
      .eq("user_id", user.id);

    if (updateError) {
      throw new Error(`Failed to update credit balance: ${updateError.message}`);
    }

    // Record the transaction
    const { error: transactionError } = await supabaseClient
      .from("credit_transactions")
      .insert({
        user_id: profile.id,
        type: "purchase",
        amount: credits,
        package_id: packageId,
        stripe_session_id: session_id,
        description: `Purchased ${credits} credits`,
      });

    if (transactionError) {
      logStep("Warning: Failed to record transaction", { error: transactionError.message });
    }

    logStep("Credits added successfully", { newBalance });

    return new Response(
      JSON.stringify({
        success: true,
        credits_added: credits,
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
