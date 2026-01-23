import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRO_TOOLS_PRODUCT_ID = "prod_TqZ3pDNHL0r6XZ";
const MONTHLY_USAGE_LIMIT = 50;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      // Get usage count from database
      const { data: usageCount } = await supabaseClient.rpc("get_monthly_tool_usage", {
        p_user_id: user.id,
      });

      return new Response(JSON.stringify({
        subscribed: false,
        usage_count: usageCount || 0,
        usage_limit: MONTHLY_USAGE_LIMIT,
        subscription_end: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;

    // Check for active Pro Tools subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 10,
    });

    let hasProTools = false;
    let subscriptionEnd = null;

    for (const sub of subscriptions.data) {
      for (const item of sub.items.data) {
        if (item.price.product === PRO_TOOLS_PRODUCT_ID) {
          hasProTools = true;
          subscriptionEnd = new Date(sub.current_period_end * 1000).toISOString();
          break;
        }
      }
      if (hasProTools) break;
    }

    // Get usage count
    const { data: usageCount } = await supabaseClient.rpc("get_monthly_tool_usage", {
      p_user_id: user.id,
    });

    return new Response(JSON.stringify({
      subscribed: hasProTools,
      usage_count: usageCount || 0,
      usage_limit: MONTHLY_USAGE_LIMIT,
      subscription_end: subscriptionEnd,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error checking subscription:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
