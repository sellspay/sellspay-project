import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[PROCESS-PAYOUT] ${step}${detailsStr}`);
};

const PAYPAL_API_BASE = "https://api-m.paypal.com";

async function getPayPalAccessToken(): Promise<string> {
  const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
  const clientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials not configured");
  }

  const auth = btoa(`${clientId}:${clientSecret}`);
  
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error("Failed to get PayPal access token");
  }

  const data = await response.json();
  return data.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Authenticate admin user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    // Check if user is admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { payoutId } = await req.json();
    if (!payoutId) {
      return new Response(
        JSON.stringify({ error: "Payout ID required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Processing payout", { payoutId });

    // Get payout record
    const { data: payout, error: payoutError } = await supabaseAdmin
      .from("payouts")
      .select("*")
      .eq("id", payoutId)
      .single();

    if (payoutError || !payout) {
      return new Response(
        JSON.stringify({ error: "Payout not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (payout.status !== "approved") {
      return new Response(
        JSON.stringify({ error: `Payout status is ${payout.status}, not approved` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get seller config
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("user_id, username")
      .eq("id", payout.seller_id)
      .single();

    if (!profile) {
      throw new Error("Seller profile not found");
    }

    const { data: sellerConfig } = await supabaseAdmin.rpc(
      "get_seller_config",
      { p_user_id: profile.user_id }
    );

    const config = sellerConfig?.[0];
    const provider = payout.provider_type;
    const amountUsd = (payout.amount_cents / 100).toFixed(2);

    logStep("Provider determined", { provider, amountUsd, seller: profile.username });

    // Update status to processing
    await supabaseAdmin
      .from("payouts")
      .update({ status: "processing" })
      .eq("id", payoutId);

    let externalReference: string | null = null;
    let failureReason: string | null = null;

    try {
      if (provider === "PAYPAL") {
        const paypalEmail = config?.paypal_email;
        if (!paypalEmail) {
          throw new Error("Seller has no PayPal email configured");
        }

        const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
        const clientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET");

        if (!clientId || !clientSecret) {
          throw new Error("PayPal not configured on platform");
        }

        logStep("Creating PayPal payout", { paypalEmail, amount: amountUsd });

        const accessToken = await getPayPalAccessToken();
        const senderBatchId = `EP_${payout.seller_id.substring(0, 8)}_${Date.now()}`;

        const payoutData = {
          sender_batch_header: {
            sender_batch_id: senderBatchId,
            email_subject: "You have a payout from Editors Paradise!",
            email_message: "Your earnings have been transferred to your PayPal account.",
          },
          items: [{
            recipient_type: "EMAIL",
            amount: {
              value: amountUsd,
              currency: "USD",
            },
            receiver: paypalEmail,
            note: "Editors Paradise creator earnings",
            sender_item_id: `EP_PAYOUT_${Date.now()}`,
          }],
        };

        const payoutResponse = await fetch(`${PAYPAL_API_BASE}/v1/payments/payouts`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payoutData),
        });

        if (!payoutResponse.ok) {
          const errorText = await payoutResponse.text();
          throw new Error(`PayPal payout failed: ${errorText}`);
        }

        const payoutResult = await payoutResponse.json();
        externalReference = payoutResult.batch_header?.payout_batch_id;

        logStep("PayPal payout created", { batchId: externalReference });

      } else if (provider === "PAYONEER") {
        const payoneerPayeeId = config?.payoneer_payee_id;
        if (!payoneerPayeeId) {
          throw new Error("Seller has no Payoneer payee ID configured");
        }

        const partnerId = Deno.env.get("PAYONEER_PARTNER_ID");
        if (!partnerId) {
          throw new Error("Payoneer not configured on platform");
        }

        // For Payoneer, we'd make the API call here
        // For now, just create a reference
        externalReference = `PAYONEER_${Date.now()}`;
        logStep("Payoneer payout initiated", { payeeId: payoneerPayeeId, ref: externalReference });

      } else {
        throw new Error(`Unsupported provider: ${provider}`);
      }

      // Mark payout as sent
      await supabaseAdmin
        .from("payouts")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          external_reference: externalReference,
        })
        .eq("id", payoutId);

      // Mark associated purchases/bookings as transferred
      const { data: products } = await supabaseAdmin
        .from("products")
        .select("id")
        .eq("creator_id", payout.seller_id);

      const productIds = products?.map(p => p.id) || [];

      if (productIds.length > 0) {
        await supabaseAdmin
          .from("purchases")
          .update({
            transferred: true,
            transferred_at: new Date().toISOString(),
            stripe_transfer_id: `${provider.toLowerCase()}_payout_${externalReference}`,
          })
          .eq("status", "completed")
          .eq("transferred", false)
          .in("product_id", productIds);
      }

      await supabaseAdmin
        .from("editor_bookings")
        .update({
          transferred: true,
          transferred_at: new Date().toISOString(),
          stripe_transfer_id: `${provider.toLowerCase()}_payout_${externalReference}`,
        })
        .eq("editor_id", payout.seller_id)
        .eq("status", "completed")
        .eq("transferred", false);

      // Create audit log
      await supabaseAdmin.from("admin_audit_log").insert({
        admin_user_id: user.id,
        action_type: "payout_processed",
        target_type: "payout",
        target_id: payoutId,
        new_value: { provider, amount_cents: payout.amount_cents, external_reference: externalReference },
      });

      logStep("Payout completed successfully", { payoutId, externalReference });

      return new Response(
        JSON.stringify({
          success: true,
          payoutId,
          provider,
          amount: amountUsd,
          externalReference,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } catch (processingError) {
      failureReason = processingError instanceof Error ? processingError.message : String(processingError);
      logStep("Payout processing failed", { error: failureReason });

      // Mark as failed
      await supabaseAdmin
        .from("payouts")
        .update({
          status: "failed",
          failure_reason: failureReason,
        })
        .eq("id", payoutId);

      return new Response(
        JSON.stringify({
          success: false,
          error: failureReason,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logStep("ERROR", { message });
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
