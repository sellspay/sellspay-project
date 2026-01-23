import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MANAGE-CREDIT-SUBSCRIPTION] ${step}${detailsStr}`);
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
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { action } = await req.json();
    logStep("Action requested", { action });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Find customer by email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      logStep("No customer found");
      return new Response(JSON.stringify({ 
        hasSubscription: false,
        subscription: null 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    if (action === "check") {
      // Check for active credit subscriptions
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 10,
      });

      // Filter to only credit subscriptions (match product IDs)
      const creditProductIds = [
        "prod_TqZeFehQN2BIE7", // Starter
        "prod_TqZeeT61BjdEfb", // Basic  
        "prod_TqZfgqJ9WMMRZi", // Pro
        "prod_TqZgS5woMKXtj3", // Power
        "prod_TqZg4fAK1oMjcG", // Enterprise
      ];

      const creditSubscription = subscriptions.data.find((sub: Stripe.Subscription) => {
        const productId = sub.items.data[0]?.price?.product;
        return creditProductIds.includes(productId as string);
      });

      if (creditSubscription) {
        const priceAmount = creditSubscription.items.data[0]?.price?.unit_amount || 0;
        const productId = creditSubscription.items.data[0]?.price?.product as string;
        
        // Map product to credits
        const creditsMap: Record<string, number> = {
          "prod_TqZeFehQN2BIE7": 25,
          "prod_TqZeeT61BjdEfb": 50,
          "prod_TqZfgqJ9WMMRZi": 150,
          "prod_TqZgS5woMKXtj3": 350,
          "prod_TqZg4fAK1oMjcG": 1000,
        };

        logStep("Found credit subscription", { subscriptionId: creditSubscription.id });
        
        return new Response(JSON.stringify({
          hasSubscription: true,
          subscription: {
            id: creditSubscription.id,
            status: creditSubscription.status,
            currentPeriodEnd: new Date(creditSubscription.current_period_end * 1000).toISOString(),
            currentPeriodStart: new Date(creditSubscription.current_period_start * 1000).toISOString(),
            cancelAtPeriodEnd: creditSubscription.cancel_at_period_end,
            priceAmount: priceAmount,
            credits: creditsMap[productId] || 0,
            productId: productId,
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      logStep("No credit subscription found");
      return new Response(JSON.stringify({ 
        hasSubscription: false,
        subscription: null 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === "portal") {
      // Create customer portal session for subscription management
      const origin = req.headers.get("origin") || "http://localhost:3000";
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${origin}/settings`,
      });
      
      logStep("Portal session created", { url: portalSession.url });
      
      return new Response(JSON.stringify({ url: portalSession.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error("Invalid action");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
