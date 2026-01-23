import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get the raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      throw new Error("No stripe-signature header");
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      logStep("Signature verification failed", { error: message });
      return new Response(JSON.stringify({ error: `Webhook signature verification failed: ${message}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Event verified", { type: event.type, id: event.id });

    // Check for duplicate event (idempotency)
    const { data: existingEvent } = await supabaseAdmin
      .from("stripe_events")
      .select("id")
      .eq("stripe_event_id", event.id)
      .maybeSingle();

    if (existingEvent) {
      logStep("Duplicate event, skipping", { eventId: event.id });
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Record the event
    await supabaseAdmin.from("stripe_events").insert({
      stripe_event_id: event.id,
      event_type: event.type,
    });

    // Handle the event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      logStep("Processing checkout.session.completed", { sessionId: session.id });

      const metadata = session.metadata || {};
      const productId = metadata.product_id;
      const buyerProfileId = metadata.buyer_profile_id;
      const creatorProfileId = metadata.creator_profile_id;
      const platformFeeCents = parseInt(metadata.platform_fee_cents || "0");
      const creatorPayoutCents = parseInt(metadata.creator_payout_cents || "0");

      if (!productId) {
        logStep("Missing product_id in metadata");
        return new Response(JSON.stringify({ error: "Missing product_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // If no buyer profile ID, we need to create/find one based on email
      let finalBuyerProfileId = buyerProfileId;

      if (!finalBuyerProfileId && session.customer_email) {
        // Check if profile exists for this email
        const { data: existingProfile } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("email", session.customer_email)
          .maybeSingle();

        if (existingProfile) {
          finalBuyerProfileId = existingProfile.id;
        }
        logStep("Buyer profile lookup", { email: session.customer_email, profileId: finalBuyerProfileId });
      }

      if (!finalBuyerProfileId) {
        logStep("No buyer profile found, cannot record purchase");
        return new Response(JSON.stringify({ received: true, note: "No buyer profile" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create purchase record
      const { error: purchaseError } = await supabaseAdmin.from("purchases").insert({
        buyer_id: finalBuyerProfileId,
        product_id: productId,
        amount_cents: session.amount_total || 0,
        platform_fee_cents: platformFeeCents,
        creator_payout_cents: creatorPayoutCents,
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
        status: "completed",
      });

      if (purchaseError) {
        logStep("Failed to create purchase record", { error: purchaseError.message });
        throw new Error(`Failed to create purchase: ${purchaseError.message}`);
      }

      logStep("Purchase recorded successfully", { productId, buyerProfileId: finalBuyerProfileId });
    }

    if (event.type === "account.updated") {
      const account = event.data.object as Stripe.Account;
      logStep("Processing account.updated", { accountId: account.id });

      // Check if onboarding is complete
      const isComplete = account.details_submitted && account.charges_enabled && account.payouts_enabled;

      if (isComplete) {
        // Update the profile
        const { error: updateError } = await supabaseAdmin
          .from("profiles")
          .update({ stripe_onboarding_complete: true })
          .eq("stripe_account_id", account.id);

        if (updateError) {
          logStep("Failed to update profile", { error: updateError.message });
        } else {
          logStep("Profile updated - onboarding complete", { accountId: account.id });
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
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
