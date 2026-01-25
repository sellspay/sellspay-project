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

// Map Stripe product IDs to subscription tiers
const PLATFORM_SUBSCRIPTION_PRODUCTS: Record<string, string> = {
  'prod_TqywV2biJfsfYc': 'starter',
  'prod_TqywcmDO94NEYg': 'pro',
  'prod_TqywavIYdJ4IX2': 'enterprise',
};

// Map top-up product IDs to credits
const TOPUP_PRODUCTS: Record<string, number> = {
  'prod_TqyxD6x0yTSBtY': 15,
  'prod_TqyxSmJKa3LvoI': 50,
  'prod_TqyxuKkSnjURjP': 100,
  'prod_Tqyxq1sukXthJx': 250,
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
      logStep("Processing checkout.session.completed", { sessionId: session.id, mode: session.mode });

      const metadata = session.metadata || {};

      // Handle credit top-up purchase
      if (metadata.type === "credit_topup") {
        const userId = metadata.user_id;
        const topupId = metadata.topup_id;
        
        logStep("Processing credit top-up", { userId, topupId });

        // Get the topup package to find credit amount
        const { data: topupPkg } = await supabaseAdmin
          .from("credit_topups")
          .select("credits")
          .eq("id", topupId)
          .single();

        if (topupPkg) {
          // Add credits to user's balance
          const { error: updateError } = await supabaseAdmin.rpc('', {});
          
          // Direct update of credit_balance
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("credit_balance")
            .eq("user_id", userId)
            .single();
          
          const newBalance = (profile?.credit_balance || 0) + topupPkg.credits;
          
          await supabaseAdmin
            .from("profiles")
            .update({ credit_balance: newBalance })
            .eq("user_id", userId);
          
          // Record transaction
          await supabaseAdmin.from("credit_transactions").insert({
            user_id: userId,
            amount: topupPkg.credits,
            type: "topup",
            description: `Credit top-up: ${topupPkg.credits} credits`,
            stripe_session_id: session.id,
          });

          logStep("Top-up credits added", { userId, credits: topupPkg.credits, newBalance });
        }
        
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Handle editor booking checkout
      if (metadata.type === "editor_booking") {
        const editorId = metadata.editor_id;
        const buyerId = metadata.buyer_id;
        const hours = parseInt(metadata.hours || "0");
        const platformFeeCents = parseInt(metadata.platform_fee_cents || "0");
        const editorPayoutCents = parseInt(metadata.editor_payout_cents || "0");

        logStep("Processing editor booking", { editorId, buyerId, hours, editorPayoutCents });

        // Update the booking record to completed
        const { error: bookingError } = await supabaseAdmin
          .from("editor_bookings")
          .update({
            status: "completed",
            stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
          })
          .eq("stripe_checkout_session_id", session.id);

        if (bookingError) {
          logStep("Failed to update booking record", { error: bookingError.message });
        } else {
          logStep("Editor booking completed successfully", { editorId, editorPayoutCents });
        }
        
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Handle subscription checkout (platform subscriptions)
      if (session.mode === "subscription") {
        const planId = metadata.plan_id;
        const buyerProfileId = metadata.buyer_profile_id;

        // Check if this is a platform subscription
        if (typeof session.subscription === "string") {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          const productId = subscription.items.data[0]?.price?.product as string;
          const tier = PLATFORM_SUBSCRIPTION_PRODUCTS[productId];

          if (tier && session.customer_email) {
            // Update user's subscription tier
            const { error: updateError } = await supabaseAdmin
              .from("profiles")
              .update({ 
                subscription_tier: tier,
                subscription_stripe_id: session.subscription 
              })
              .eq("email", session.customer_email);

            if (updateError) {
              logStep("Failed to update subscription tier", { error: updateError.message });
            } else {
              logStep("Subscription tier updated", { tier, email: session.customer_email });
            }
          }
        }

        if (planId && buyerProfileId) {
          // Create user_subscription record for creator subscriptions
          const { error: subError } = await supabaseAdmin.from("user_subscriptions").insert({
            user_id: buyerProfileId,
            plan_id: planId,
            status: "active",
            stripe_subscription_id: typeof session.subscription === "string" ? session.subscription : null,
            stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          });

          if (subError) {
            logStep("Failed to create subscription record", { error: subError.message });
          } else {
            logStep("Subscription recorded successfully", { planId, buyerProfileId });
          }
        }
      } else {
        // Handle one-time payment checkout (product purchase)
        const productId = metadata.product_id;
        const buyerProfileId = metadata.buyer_profile_id;
        const platformFeeCents = parseInt(metadata.platform_fee_cents || "0");
        const creatorPayoutCents = parseInt(metadata.creator_payout_cents || "0");

        if (!productId) {
          logStep("Missing product_id in metadata, not a product purchase");
          return new Response(JSON.stringify({ received: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        let finalBuyerProfileId = buyerProfileId;

        if (!finalBuyerProfileId && session.customer_email) {
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
    }

    // Handle subscription updates
    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      logStep("Processing subscription.updated", { subscriptionId: subscription.id, status: subscription.status });

      // Check if it's a platform subscription
      const productId = subscription.items.data[0]?.price?.product as string;
      const tier = PLATFORM_SUBSCRIPTION_PRODUCTS[productId];

      if (tier) {
        // Update profile subscription tier based on subscription status
        if (subscription.status === "active") {
          await supabaseAdmin
            .from("profiles")
            .update({ subscription_tier: tier })
            .eq("subscription_stripe_id", subscription.id);
          logStep("Platform subscription tier updated", { tier, subscriptionId: subscription.id });
        }
      }

      // Update user_subscriptions table
      const { error: updateError } = await supabaseAdmin
        .from("user_subscriptions")
        .update({
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
        })
        .eq("stripe_subscription_id", subscription.id);

      if (updateError) {
        logStep("Failed to update subscription", { error: updateError.message });
      } else {
        logStep("Subscription updated successfully");
      }
    }

    // Handle subscription cancellation
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      logStep("Processing subscription.deleted", { subscriptionId: subscription.id });

      // Check if it's a platform subscription and clear the tier
      const productId = subscription.items.data[0]?.price?.product as string;
      if (PLATFORM_SUBSCRIPTION_PRODUCTS[productId]) {
        await supabaseAdmin
          .from("profiles")
          .update({ subscription_tier: null, subscription_stripe_id: null })
          .eq("subscription_stripe_id", subscription.id);
        logStep("Platform subscription tier cleared", { subscriptionId: subscription.id });
      }

      const { error: updateError } = await supabaseAdmin
        .from("user_subscriptions")
        .update({
          status: "canceled",
          canceled_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", subscription.id);

      if (updateError) {
        logStep("Failed to cancel subscription", { error: updateError.message });
      } else {
        logStep("Subscription canceled successfully");
      }
    }

    if (event.type === "account.updated") {
      const account = event.data.object as Stripe.Account;
      logStep("Processing account.updated", { accountId: account.id });

      const isComplete = account.details_submitted && account.charges_enabled && account.payouts_enabled;

      if (isComplete) {
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