import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-EDITOR-BOOKING] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    logStep("Stripe key verified");

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Parse request body
    const { editorId, buyerId, hours, hourlyRateCents } = await req.json();
    logStep("Request body parsed", { editorId, buyerId, hours, hourlyRateCents });

    if (!editorId || !buyerId || !hours || !hourlyRateCents) {
      throw new Error("Missing required fields: editorId, buyerId, hours, hourlyRateCents");
    }

    // Calculate amounts
    const totalAmountCents = hours * hourlyRateCents;
    const platformFeeCents = Math.round(totalAmountCents * 0.05); // 5% platform fee
    const editorPayoutCents = totalAmountCents - platformFeeCents;

    logStep("Amounts calculated", { totalAmountCents, platformFeeCents, editorPayoutCents });

    // Get editor's profile to check for Stripe account
    const { data: editorProfile, error: editorError } = await supabaseClient
      .from("profiles")
      .select("stripe_account_id, full_name, username")
      .eq("id", editorId)
      .single();

    if (editorError) throw new Error(`Failed to fetch editor profile: ${editorError.message}`);
    logStep("Editor profile fetched", { editorProfile });

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check if user already has a Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string;

    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      const customer = await stripe.customers.create({ email: user.email });
      customerId = customer.id;
      logStep("New customer created", { customerId });
    }

    // Get origin for redirect URLs
    const origin = req.headers.get("origin") || "https://editorsparadise.com";

    // Create Checkout Session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${hours} hour${hours > 1 ? 's' : ''} of editing services`,
              description: `Editing services from ${editorProfile?.full_name || editorProfile?.username || 'Editor'}`,
            },
            unit_amount: totalAmountCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/dashboard?booking=success`,
      cancel_url: `${origin}/hire-editors?booking=cancelled`,
      metadata: {
        type: "editor_booking",
        editor_id: editorId,
        buyer_id: buyerId,
        hours: hours.toString(),
        hourly_rate_cents: hourlyRateCents.toString(),
        platform_fee_cents: platformFeeCents.toString(),
        editor_payout_cents: editorPayoutCents.toString(),
      },
    };

    // If editor has Stripe Connect account, use transfer
    if (editorProfile?.stripe_account_id) {
      sessionParams.payment_intent_data = {
        transfer_data: {
          destination: editorProfile.stripe_account_id,
          amount: editorPayoutCents,
        },
      };
      logStep("Stripe Connect transfer configured", { 
        destination: editorProfile.stripe_account_id,
        amount: editorPayoutCents 
      });
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    // Create booking record with pending status
    const { data: booking, error: bookingError } = await supabaseClient
      .from("editor_bookings")
      .insert({
        editor_id: editorId,
        buyer_id: buyerId,
        hours: hours,
        total_amount_cents: totalAmountCents,
        platform_fee_cents: platformFeeCents,
        editor_payout_cents: editorPayoutCents,
        stripe_checkout_session_id: session.id,
        status: "pending",
      })
      .select()
      .single();

    if (bookingError) {
      logStep("Warning: Failed to create booking record", { error: bookingError.message });
      // Don't throw - let the checkout continue, webhook will handle it
    } else {
      logStep("Booking record created", { bookingId: booking.id });
    }

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
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