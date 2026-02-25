import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
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
      logStep("No auth header - returning default browser state");
      return new Response(
        JSON.stringify({
          plan: 'browser',
          credits: 0,
          capabilities: { vibecoder: false, imageGen: false, videoGen: false },
          sellerFee: 10,
          badge: 'none',
          expiresAt: null,
          stripeSubscriptionId: null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      logStep("Auth failed - returning default browser state");
      return new Response(
        JSON.stringify({
          plan: 'browser',
          credits: 0,
          capabilities: { vibecoder: false, imageGen: false, videoGen: false },
          sellerFee: 10,
          badge: 'none',
          expiresAt: null,
          stripeSubscriptionId: null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }
    
    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    // Get profile with subscription info
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("subscription_plan, subscription_expires_at, stripe_subscription_id")
      .eq("user_id", user.id)
      .single();

    if (profileError) {
      logStep("Error fetching profile", { error: profileError.message });
      throw new Error(`Failed to fetch profile: ${profileError.message}`);
    }

    const planId = profile?.subscription_plan || 'browser';
    logStep("Profile fetched", { planId });

    // Get plan details
    const { data: plan, error: planError } = await supabaseClient
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (planError) {
      logStep("Error fetching plan", { error: planError.message });
      // Default to browser if plan not found
    }

    // Get wallet balance
    const { data: wallet, error: walletError } = await supabaseClient
      .from("user_wallets")
      .select("balance, rollover_credits, monthly_credits, bonus_credits")
      .eq("user_id", user.id)
      .single();

    if (walletError && walletError.code !== 'PGRST116') {
      logStep("Error fetching wallet", { error: walletError.message });
    }

    const credits = wallet?.balance ?? 0;
    const creditBreakdown = {
      rollover: (wallet as any)?.rollover_credits ?? 0,
      monthly: (wallet as any)?.monthly_credits ?? 0,
      bonus: (wallet as any)?.bonus_credits ?? 0,
    };
    logStep("Data fetched", { credits, planId });

    const response = {
      plan: planId,
      credits,
      creditBreakdown,
      capabilities: {
        vibecoder: plan?.vibecoder_access ?? false,
        imageGen: plan?.image_gen_access ?? false,
        videoGen: plan?.video_gen_access ?? false,
      },
      sellerFee: plan?.seller_fee_percent ?? 10,
      badge: plan?.badge_type ?? 'none',
      expiresAt: profile?.subscription_expires_at ?? null,
      stripeSubscriptionId: profile?.stripe_subscription_id ?? null,
    };

    logStep("Returning subscription state", response);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
