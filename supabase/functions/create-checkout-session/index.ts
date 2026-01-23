import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Use anon key for user auth
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    // Use service role for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const { product_id } = await req.json();
    if (!product_id) throw new Error("product_id is required");
    logStep("Product ID received", { product_id });

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    let buyerEmail: string | undefined;
    let buyerProfileId: string | undefined;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabaseClient.auth.getUser(token);
      if (userData.user?.email) {
        buyerEmail = userData.user.email;
        // Get buyer profile ID
        const { data: buyerProfile } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("user_id", userData.user.id)
          .single();
        buyerProfileId = buyerProfile?.id;
        logStep("Buyer authenticated", { email: buyerEmail, profileId: buyerProfileId });
      }
    }

    // Fetch product details
    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select(`
        id,
        name,
        price_cents,
        cover_image_url,
        creator_id,
        profiles!products_creator_id_fkey (
          id,
          stripe_account_id,
          stripe_onboarding_complete
        )
      `)
      .eq("id", product_id)
      .single();

    if (productError || !product) {
      throw new Error("Product not found");
    }
    logStep("Product found", { name: product.name, price: product.price_cents });

    // Get creator profile - handle the join result
    const creatorProfile = Array.isArray(product.profiles) 
      ? product.profiles[0] 
      : product.profiles;

    if (!creatorProfile?.stripe_account_id || !creatorProfile?.stripe_onboarding_complete) {
      throw new Error("Creator has not completed Stripe onboarding");
    }
    logStep("Creator verified", { stripeAccountId: creatorProfile.stripe_account_id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Calculate fees (5% platform commission)
    const totalAmount = product.price_cents || 0;
    const platformFee = Math.round(totalAmount * 0.05);
    logStep("Fees calculated", { total: totalAmount, platformFee, creatorPayout: totalAmount - platformFee });

    // Check if customer exists
    let customerId: string | undefined;
    if (buyerEmail) {
      const customers = await stripe.customers.list({ email: buyerEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Existing customer found", { customerId });
      }
    }

    const origin = req.headers.get("origin") || "https://editorsparadise.org";

    // Create checkout session with Connect
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : buyerEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: product.name,
              images: product.cover_image_url ? [product.cover_image_url] : [],
            },
            unit_amount: totalAmount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      payment_intent_data: {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: creatorProfile.stripe_account_id,
        },
      },
      success_url: `${origin}/product/${product_id}?purchase=success`,
      cancel_url: `${origin}/product/${product_id}?purchase=canceled`,
      metadata: {
        product_id: product_id,
        buyer_profile_id: buyerProfileId || "",
        creator_profile_id: creatorProfile.id,
        platform_fee_cents: platformFee.toString(),
        creator_payout_cents: (totalAmount - platformFee).toString(),
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
