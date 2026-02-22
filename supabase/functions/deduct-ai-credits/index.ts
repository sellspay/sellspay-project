import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[DEDUCT-AI-CREDITS] ${step}${detailsStr}`);
};

// Legacy flat credit costs (fallback if dynamic calculation fails)
const LEGACY_CREDIT_COSTS: Record<string, number> = {
  vibecoder_gen: 3,
  vibecoder_flash: 0,
  image_gen: 10,
  video_gen: 50,
  sfx_gen: 5,
  voice_isolator: 5,
  sfx_isolator: 5,
  music_splitter: 5,
};

// Action to required capability mapping
const ACTION_REQUIREMENTS: Record<string, string> = {
  vibecoder_gen: 'vibecoder_access',
  image_gen: 'image_gen_access',
  video_gen: 'video_gen_access',
  sfx_gen: 'vibecoder_access',
  voice_isolator: 'vibecoder_access',
  sfx_isolator: 'vibecoder_access',
  music_splitter: 'vibecoder_access',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
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
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid token" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }
    
    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    const body = await req.json();
    const { 
      action, 
      amount,
      // New dynamic billing fields
      model_used,
      tokens_input = 0,
      tokens_output = 0,
      session_id,
      is_auto_mode = false,
      is_plan_mode = false,
      is_retry = false,
      metadata = {}
    } = body;
    
    if (!action) {
      return new Response(
        JSON.stringify({ success: false, error: "Action is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Determine cost: use provided amount, or legacy flat cost
    const legacyCost = LEGACY_CREDIT_COSTS[action] ?? 3;
    const cost = amount ?? legacyCost;
    logStep("Processing deduction", { action, cost, model_used, tokens_input, tokens_output });

    // Get profile to check plan
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("subscription_plan")
      .eq("user_id", user.id)
      .single();

    if (profileError) {
      logStep("Error fetching profile", { error: profileError.message });
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch profile" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Get plan capabilities
    const { data: plan, error: planError } = await supabaseClient
      .from("subscription_plans")
      .select("*")
      .eq("id", profile?.subscription_plan || 'browser')
      .single();

    if (planError) {
      logStep("Error fetching plan", { error: planError.message });
    }

    // Check if user has required capability
    const requiredCapability = ACTION_REQUIREMENTS[action];
    if (requiredCapability && plan && !plan[requiredCapability]) {
      return new Response(
        JSON.stringify({ success: false, error: "UPGRADE_REQUIRED" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    // Use the NEW dynamic RPC if model/token info is provided, otherwise fall back to legacy
    let result;
    
    if (model_used || tokens_input > 0 || tokens_output > 0) {
      // Dynamic billing with token tracking
      logStep("Using dynamic billing", { model_used, tokens_input, tokens_output });
      
      const { data, error: deductError } = await supabaseClient
        .rpc('deduct_credits_dynamic', { 
          p_user_id: user.id, 
          p_amount: cost,
          p_action: action,
          p_model_used: model_used || null,
          p_tokens_input: tokens_input,
          p_tokens_output: tokens_output,
          p_session_id: session_id || null,
          p_is_auto_mode: is_auto_mode,
          p_is_plan_mode: is_plan_mode,
          p_is_retry: is_retry,
          p_metadata: metadata
        });

      if (deductError) {
        logStep("Error in dynamic deduction", { error: deductError.message });
        return new Response(
          JSON.stringify({ success: false, error: "Failed to deduct credits" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      result = data;
    } else {
      // Legacy flat-cost deduction
      logStep("Using legacy billing");
      
      const { data: success, error: deductError } = await supabaseClient
        .rpc('deduct_credits', { 
          p_user_id: user.id, 
          p_amount: cost,
          p_action: action 
        });

      if (deductError) {
        logStep("Error deducting credits", { error: deductError.message });
        return new Response(
          JSON.stringify({ success: false, error: "Failed to deduct credits" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      if (!success) {
        logStep("Insufficient credits");
        return new Response(
          JSON.stringify({ success: false, error: "INSUFFICIENT_CREDITS" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 402 }
        );
      }

      // Get new balance for legacy response
      const { data: wallet } = await supabaseClient
        .from("user_wallets")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      result = { success: true, newBalance: wallet?.balance ?? 0, cost };
    }

    // Handle dynamic billing result
    if (result && typeof result === 'object') {
      if (result.error === 'INSUFFICIENT_CREDITS') {
        logStep("Insufficient credits (dynamic)", { balance: result.balance, cost: result.cost });
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "INSUFFICIENT_CREDITS",
            required: result.cost,
            balance: result.balance
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 402 }
        );
      }
      
      if (result.error === 'NO_WALLET') {
        logStep("No wallet found");
        return new Response(
          JSON.stringify({ success: false, error: "No wallet found. Please contact support." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
        );
      }

      if (result.success) {
        logStep("Credits deducted successfully", { 
          cost: result.cost, 
          newBalance: result.newBalance,
          baseCost: result.baseCost,
          multiplier: result.multiplier
        });

        // Trigger referral reward if this user was referred and hasn't been rewarded yet
        try {
          const { data: refResult } = await supabaseClient.rpc('process_referral_reward', {
            p_referred_user_id: user.id,
          });
          if (refResult?.rewarded) {
            logStep("Referral reward triggered", refResult);
          }
        } catch (refErr) {
          logStep("Referral reward check failed (non-critical)", { error: String(refErr) });
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            newBalance: result.newBalance,
            cost: result.cost,
            baseCost: result.baseCost,
            multiplier: result.multiplier
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
    }

    // Fallback success response
    return new Response(
      JSON.stringify({ success: true, newBalance: result?.newBalance ?? 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
