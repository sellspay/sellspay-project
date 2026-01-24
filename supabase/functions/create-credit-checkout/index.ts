import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CREDIT-CHECKOUT] ${step}${detailsStr}`);
};

// Credit product IDs for our platform subscriptions
const CREDIT_PRODUCT_IDS = [
  "prod_TqZeFehQN2BIE7", // Starter
  "prod_TqZeeT61BjdEfb", // Basic  
  "prod_TqZfgqJ9WMMRZi", // Pro
  "prod_TqZgS5woMKXtj3", // Power
  "prod_TqZg4fAK1oMjcG", // Enterprise
];

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
      throw new Error("User not authenticated or email not available");
    }
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { package_id, price_id } = await req.json();
    if (!package_id) {
      throw new Error("package_id is required");
    }

    logStep("Package requested", { package_id, price_id });

    // Get the package details
    const { data: packageData, error: packageError } = await supabaseClient
      .from("credit_packages")
      .select("*")
      .eq("id", package_id)
      .eq("is_active", true)
      .single();

    if (packageError || !packageData) {
      throw new Error("Package not found or inactive");
    }

    logStep("Package found", { 
      name: packageData.name, 
      credits: packageData.credits,
      price_cents: packageData.price_cents 
    });

    // Use provided monthly price_id or fall back to stored stripe_price_id
    const stripePrice = price_id || packageData.stripe_price_id;
    if (!stripePrice) {
      throw new Error("Package does not have a Stripe price configured");
    }

    // Get user's profile ID
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });

      // Check if user has an existing credit subscription
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 10,
      });

      // Find existing credit subscription
      const existingCreditSub = subscriptions.data.find((sub: Stripe.Subscription) => {
        const productId = sub.items.data[0]?.price?.product;
        return CREDIT_PRODUCT_IDS.includes(productId as string);
      });

      if (existingCreditSub) {
        logStep("Found existing credit subscription", { 
          subscriptionId: existingCreditSub.id,
          currentProductId: existingCreditSub.items.data[0]?.price?.product
        });

        // Get the new price details to compare
        const newPrice = await stripe.prices.retrieve(stripePrice);
        const currentPrice = existingCreditSub.items.data[0]?.price;
        
        if (!currentPrice) {
          throw new Error("Could not retrieve current subscription price");
        }

        const currentAmount = currentPrice.unit_amount || 0;
        const newAmount = newPrice.unit_amount || 0;

        logStep("Comparing prices", { currentAmount, newAmount });

        // Only allow upgrades (higher price) with proration
        if (newAmount <= currentAmount) {
          throw new Error("You can only upgrade to a higher tier. To downgrade, please manage your subscription in Settings.");
        }

        // Update the existing subscription with proration
        // This will charge only the difference for the remaining billing period
        const subscriptionItemId = existingCreditSub.items.data[0].id;
        
        const updatedSubscription = await stripe.subscriptions.update(existingCreditSub.id, {
          items: [
            {
              id: subscriptionItemId,
              price: stripePrice,
            },
          ],
          proration_behavior: "always_invoice", // Immediately charge the prorated difference
          metadata: {
            user_id: user.id,
            profile_id: profile?.id || "",
            package_id: package_id,
            credits: packageData.credits.toString(),
            package_name: packageData.name,
            upgrade_from_amount: currentAmount.toString(),
            upgrade_to_amount: newAmount.toString(),
          },
        });

        logStep("Subscription upgraded with proration", { 
          subscriptionId: updatedSubscription.id,
          status: updatedSubscription.status,
          proratedCharge: newAmount - currentAmount
        });

        // Add the new credits to the user's balance
        // Calculate prorated credits based on remaining time in billing cycle
        const currentPeriodStart = existingCreditSub.current_period_start;
        const currentPeriodEnd = existingCreditSub.current_period_end;
        const now = Math.floor(Date.now() / 1000);
        
        // For simplicity, give full new credits on upgrade
        // (The user already has remaining credits from old tier, we add the difference)
        const creditsMap: Record<string, number> = {
          "prod_TqZeFehQN2BIE7": 15,
          "prod_TqZeeT61BjdEfb": 50,
          "prod_TqZfgqJ9WMMRZi": 150,
          "prod_TqZgS5woMKXtj3": 350,
          "prod_TqZg4fAK1oMjcG": 800,
        };

        const currentProductId = currentPrice.product as string;
        const newProductId = newPrice.product as string;
        const currentCredits = creditsMap[currentProductId] || 0;
        const newCredits = creditsMap[newProductId] || packageData.credits;
        const creditsToAdd = newCredits - currentCredits;

        if (creditsToAdd > 0 && profile?.id) {
          // Get current credit balance
          const { data: profileData } = await supabaseClient
            .from("profiles")
            .select("credit_balance")
            .eq("id", profile.id)
            .single();

          const currentBalance = profileData?.credit_balance || 0;
          const newBalance = currentBalance + creditsToAdd;

          // Update credit balance
          await supabaseClient
            .from("profiles")
            .update({ credit_balance: newBalance })
            .eq("id", profile.id);

          // Log the transaction
          await supabaseClient
            .from("credit_transactions")
            .insert({
              user_id: user.id,
              amount: creditsToAdd,
              type: "upgrade",
              description: `Upgrade from ${currentCredits} to ${newCredits} credits/month`,
              package_id: package_id,
            });

          logStep("Credits added for upgrade", { 
            creditsToAdd, 
            newBalance,
            from: currentCredits,
            to: newCredits
          });
        }

        return new Response(
          JSON.stringify({ 
            success: true,
            upgraded: true,
            message: `Subscription upgraded! You've been charged $${((newAmount - currentAmount) / 100).toFixed(2)} for the upgrade and received ${creditsToAdd} additional credits.`,
            creditsAdded: creditsToAdd,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }
    }

    const origin = req.headers.get("origin") || "https://editorsparadise.com";

    // No existing subscription - create new checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: stripePrice,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/pricing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?canceled=true`,
      metadata: {
        user_id: user.id,
        profile_id: profile?.id || "",
        package_id: package_id,
        credits: packageData.credits.toString(),
        package_name: packageData.name,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          profile_id: profile?.id || "",
          package_id: package_id,
          credits: packageData.credits.toString(),
          package_name: packageData.name,
        },
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(
      JSON.stringify({ url: session.url }),
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
