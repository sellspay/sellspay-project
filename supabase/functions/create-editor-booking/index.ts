import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-EDITOR-BOOKING] ${step}${detailsStr}`);
};

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
      return new Response(
        JSON.stringify({ error: "No authorization header provided" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) {
      return new Response(
        JSON.stringify({ error: `Authentication error: ${userError.message}` }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const user = userData.user;
    if (!user?.email) {
      return new Response(
        JSON.stringify({ error: "User not authenticated or email not available" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Parse and validate request body
    let body: { editorId?: string; buyerId?: string; hours?: number; hourlyRateCents?: number };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { editorId, buyerId, hours, hourlyRateCents } = body;
    logStep("Request body parsed", { editorId, buyerId, hours, hourlyRateCents });

    // Validate required fields exist
    if (!editorId || !buyerId || !hours || !hourlyRateCents) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: editorId, buyerId, hours, hourlyRateCents" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate UUIDs
    if (!UUID_REGEX.test(editorId)) {
      return new Response(
        JSON.stringify({ error: "editorId must be a valid UUID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!UUID_REGEX.test(buyerId)) {
      return new Response(
        JSON.stringify({ error: "buyerId must be a valid UUID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate hours (1-100)
    if (typeof hours !== 'number' || !Number.isInteger(hours) || hours < 1 || hours > 100) {
      return new Response(
        JSON.stringify({ error: "hours must be an integer between 1 and 100" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate hourlyRateCents (100 cents to $1000/hr = 100000 cents)
    if (typeof hourlyRateCents !== 'number' || !Number.isInteger(hourlyRateCents) || hourlyRateCents < 100 || hourlyRateCents > 100000) {
      return new Response(
        JSON.stringify({ error: "hourlyRateCents must be an integer between 100 and 100000" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate amounts - use safe integer arithmetic
    // Maximum: 100 hours * $1000/hr = $100,000 = 10,000,000 cents (safe for JS integers)
    const totalAmountCents = hours * hourlyRateCents;
    
    // Final safety check on total
    if (totalAmountCents > 10000000) { // Max $100,000
      return new Response(
        JSON.stringify({ error: "Total amount exceeds maximum allowed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const platformFeeCents = Math.round(totalAmountCents * 0.05); // 5% platform fee
    const editorPayoutCents = totalAmountCents - platformFeeCents; // 95% to editor

    logStep("Fee breakdown", { 
      totalCharged: totalAmountCents, 
      platformFee: platformFeeCents,
      editorPayout: editorPayoutCents,
      platformFeePercentage: "5%",
      editorPayoutPercentage: "95%"
    });

    // Get editor's profile to check for Stripe account
    const { data: editorProfile, error: editorError } = await supabaseClient
      .from("profiles")
      .select("stripe_account_id, stripe_onboarding_complete, full_name, username")
      .eq("id", editorId)
      .single();

    if (editorError) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch editor profile: ${editorError.message}` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    logStep("Editor profile fetched", { 
      hasStripeAccount: !!editorProfile?.stripe_account_id,
      onboardingComplete: editorProfile?.stripe_onboarding_complete 
    });

    // Verify editor has completed Stripe onboarding
    if (!editorProfile?.stripe_account_id || !editorProfile?.stripe_onboarding_complete) {
      return new Response(
        JSON.stringify({ error: "Editor has not completed Stripe onboarding" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

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
    const origin = req.headers.get("origin") || "https://editorsparadise.org";

    // Create Checkout Session with Stripe Connect
    const session = await stripe.checkout.sessions.create({
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
      payment_intent_data: {
        application_fee_amount: platformFeeCents,
        transfer_data: {
          destination: editorProfile.stripe_account_id,
        },
      },
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
    });

    logStep("Checkout session created", { 
      sessionId: session.id, 
      url: session.url,
      amountTotal: totalAmountCents,
      applicationFee: platformFeeCents
    });

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