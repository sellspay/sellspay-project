import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[GET-EXTERNAL-ACCOUNTS] ${step}${detailsStr}`);
};

interface ExternalAccount {
  id: string;
  bank_name: string | null;
  last4: string;
  account_type: string | null;
  currency: string;
  default_for_currency: boolean;
  status: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase credentials not configured");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Use service role to access private.seller_config via RPC
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseServiceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Fetch seller config using the secure RPC function
    const { data: sellerConfig, error: configError } = await supabaseAdmin
      .rpc("get_seller_config", { p_user_id: user.id });

    if (configError) throw new Error(`Seller config error: ${configError.message}`);
    
    const config = sellerConfig?.[0];
    
    if (!config || !config.stripe_account_id) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          accounts: [], 
          connected: false,
          message: "No Stripe account connected" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
    logStep("Seller config found", { stripeAccountId: config.stripe_account_id });

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Fetch external accounts (bank accounts) for the connected account
    const externalAccounts = await stripe.accounts.listExternalAccounts(
      config.stripe_account_id,
      { object: "bank_account", limit: 10 }
    );
    logStep("External accounts fetched", { count: externalAccounts.data.length });

    // Map to simplified format
    const accounts: ExternalAccount[] = externalAccounts.data.map((account: Stripe.BankAccount | Stripe.Card) => {
      // Type guard for bank account
      if (account.object === "bank_account") {
        return {
          id: account.id,
          bank_name: account.bank_name,
          last4: account.last4,
          account_type: account.account_holder_type,
          currency: account.currency.toUpperCase(),
          default_for_currency: account.default_for_currency ?? false,
          status: account.status,
        };
      }
      // Fallback for card (shouldn't happen with object filter)
      return {
        id: account.id,
        bank_name: null,
        last4: "****",
        account_type: null,
        currency: "USD",
        default_for_currency: false,
        status: null,
      };
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        accounts,
        connected: true,
        onboardingComplete: config.stripe_onboarding_complete ?? false,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ success: false, error: errorMessage, accounts: [] }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
