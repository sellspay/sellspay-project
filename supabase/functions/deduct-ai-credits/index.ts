import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[DEDUCT-AI-CREDITS] ${step}${detailsStr}`);
};

// Credit costs for different actions
// VibeCoder 2.1: Tiered pricing based on complexity
const CREDIT_COSTS: Record<string, number> = {
  // VibeCoder actions (tiered by orchestrator, these are fallbacks)
  vibecoder_gen: 8,       // Full generation (default medium complexity)
  vibecoder_flash: 1,     // Quick edit mode
  vibecoder_heal: 0,      // Healing is free (already paid for gen)
  // Creative Studio
  image_gen: 10,          // ~$0.04 API cost × 2.5 margin
  video_gen: 50,          // ~$0.50 API cost × 1.25 margin
  // Audio tools
  sfx_gen: 5,             // Sound effect generation
  voice_isolator: 5,      // Voice isolation
  sfx_isolator: 5,        // SFX isolation
  music_splitter: 5,      // Stem separation
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

    const { action, amount } = await req.json();
    
    if (!action || !CREDIT_COSTS[action]) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid action" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const cost = amount || CREDIT_COSTS[action];
    logStep("Deducting credits", { action, cost });

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

    // Attempt to deduct credits using RPC
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

    // Get new balance
    const { data: wallet } = await supabaseClient
      .from("user_wallets")
      .select("balance")
      .eq("user_id", user.id)
      .single();

    const newBalance = wallet?.balance ?? 0;
    logStep("Credits deducted successfully", { newBalance });

    return new Response(
      JSON.stringify({ success: true, newBalance }),
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
