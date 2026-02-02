import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[PAYPAL-OAUTH-CALLBACK] ${step}${detailsStr}`);
};

serve(async (req) => {
  try {
    logStep("Callback received");

    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");

    // Redirect URL for the frontend
    const frontendUrl = "https://sellspay.com/settings";

    if (error) {
      logStep("OAuth error from PayPal", { error, errorDescription });
      return Response.redirect(`${frontendUrl}?paypal_error=${encodeURIComponent(errorDescription || error)}`);
    }

    if (!code || !state) {
      logStep("Missing code or state");
      return Response.redirect(`${frontendUrl}?paypal_error=missing_params`);
    }

    // Decode and verify state
    let stateData: { userId: string; timestamp: number; nonce: string };
    try {
      stateData = JSON.parse(atob(state));
      logStep("State decoded", { userId: stateData.userId });
      
      // Check if state is expired (10 minutes)
      if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
        logStep("State expired");
        return Response.redirect(`${frontendUrl}?paypal_error=session_expired`);
      }
    } catch {
      logStep("Invalid state token");
      return Response.redirect(`${frontendUrl}?paypal_error=invalid_state`);
    }

    const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
    const clientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!clientId || !clientSecret) {
      return Response.redirect(`${frontendUrl}?paypal_error=not_configured`);
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Exchange code for access token
    const isLive = Deno.env.get("PAYPAL_ENVIRONMENT") === "live";
    const paypalApiBase = isLive 
      ? "https://api-m.paypal.com" 
      : "https://api-m.sandbox.paypal.com";

    const redirectUri = `${supabaseUrl}/functions/v1/paypal-oauth-callback`;
    
    const tokenResponse = await fetch(`${paypalApiBase}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      logStep("Token exchange failed", { status: tokenResponse.status, error: errorText });
      return Response.redirect(`${frontendUrl}?paypal_error=token_failed`);
    }

    const tokenData = await tokenResponse.json();
    logStep("Token received", { hasAccessToken: !!tokenData.access_token });

    // Get user info from PayPal
    const userInfoResponse = await fetch(`${paypalApiBase}/v1/identity/oauth2/userinfo?schema=paypalv1.1`, {
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json",
      },
    });

    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text();
      logStep("User info fetch failed", { status: userInfoResponse.status, error: errorText });
      return Response.redirect(`${frontendUrl}?paypal_error=userinfo_failed`);
    }

    const userInfo = await userInfoResponse.json();
    logStep("PayPal user info received", { 
      payerId: userInfo.payer_id,
      hasEmail: !!userInfo.emails,
    });

    // Extract the primary/verified email
    const primaryEmail = userInfo.emails?.find((e: { primary?: boolean }) => e.primary)?.value 
      || userInfo.emails?.[0]?.value;
    const payerId = userInfo.payer_id;

    if (!primaryEmail || !payerId) {
      logStep("Missing email or payer ID from PayPal");
      return Response.redirect(`${frontendUrl}?paypal_error=missing_info`);
    }

    logStep("Verified PayPal account", { email: primaryEmail, payerId });

    // Update seller config with verified PayPal info
    const { error: updateError } = await supabaseClient.rpc(
      "update_seller_paypal_config",
      { 
        p_user_id: stateData.userId, 
        p_paypal_email: primaryEmail,
      }
    );

    if (updateError) {
      logStep("Error updating seller config", { error: updateError.message });
      return Response.redirect(`${frontendUrl}?paypal_error=save_failed`);
    }

    // Clean up the state token (service role client)
    await supabaseClient
      .from("paypal_oauth_states")
      .delete()
      .eq("state_token", state);

    logStep("PayPal connected successfully", { userId: stateData.userId, email: primaryEmail });

    // Redirect back to settings with success
    return Response.redirect(`${frontendUrl}?paypal_connected=true`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return Response.redirect(`https://editorsparadise.lovable.app/settings?paypal_error=${encodeURIComponent(errorMessage)}`);
  }
});
