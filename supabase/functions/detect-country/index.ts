import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[DETECT-COUNTRY] ${step}${detailsStr}`);
};

/**
 * Detects user's country from IP and returns recommended payout provider.
 * Uses the CF-IPCountry header (Cloudflare) or falls back to ipapi.co
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Try Cloudflare header first (fastest, no API call needed)
    let countryCode = req.headers.get("CF-IPCountry");
    let countryName: string | null = null;
    
    // If no CF header, try to get from X-Forwarded-For IP
    if (!countryCode || countryCode === "XX") {
      const forwardedFor = req.headers.get("X-Forwarded-For");
      const clientIP = forwardedFor?.split(",")[0]?.trim();
      
      if (clientIP && clientIP !== "127.0.0.1") {
        try {
          // Use ipapi.co (free tier: 1000 requests/day)
          const geoResponse = await fetch(`https://ipapi.co/${clientIP}/json/`);
          if (geoResponse.ok) {
            const geoData = await geoResponse.json();
            countryCode = geoData.country_code;
            countryName = geoData.country_name;
            logStep("Got country from ipapi", { countryCode, countryName });
          }
        } catch (geoErr) {
          logStep("GeoIP lookup failed", { error: geoErr });
        }
      }
    }

    // Default to US if detection fails
    if (!countryCode) {
      countryCode = "US";
      countryName = "United States";
      logStep("Using default country", { countryCode });
    }

    logStep("Country detected", { countryCode, countryName });

    // Get eligibility info from database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const { data: eligibility, error: eligError } = await supabaseAdmin
      .from("country_eligibility")
      .select("*")
      .eq("country_code", countryCode)
      .maybeSingle();

    if (eligError) {
      logStep("Error fetching eligibility", { error: eligError.message });
    }

    // Determine available providers and recommendation
    let providers = {
      stripe: false,
      paypal: true,
      payoneer: true,
    };
    let recommendedProvider = "paypal";
    let hasAnyProvider = true;

    if (eligibility) {
      providers.stripe = eligibility.connect_eligible ?? false;
      providers.paypal = eligibility.paypal_eligible ?? true;
      providers.payoneer = eligibility.payoneer_eligible ?? true;
      recommendedProvider = eligibility.recommended_provider || "paypal";
      countryName = eligibility.country_name || countryName;
      
      // Check if no providers are available
      hasAnyProvider = providers.stripe || providers.paypal || providers.payoneer;
    }

    logStep("Provider eligibility determined", { providers, recommendedProvider, hasAnyProvider });

    // Optionally save detected country to user's profile
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      try {
        const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
        
        const token = authHeader.replace("Bearer ", "");
        const { data: userData } = await supabaseClient.auth.getUser(token);
        
        if (userData?.user) {
          await supabaseAdmin
            .from("profiles")
            .update({ detected_country_code: countryCode })
            .eq("user_id", userData.user.id);
          logStep("Updated user's detected country", { userId: userData.user.id, countryCode });
        }
      } catch (saveErr) {
        logStep("Failed to save detected country (non-blocking)", { error: saveErr });
      }
    }

    return new Response(JSON.stringify({
      countryCode,
      countryName: countryName || countryCode,
      providers,
      recommendedProvider,
      hasAnyProvider,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ 
      error: message,
      countryCode: "US",
      countryName: "United States",
      providers: { stripe: true, paypal: true, payoneer: true },
      recommendedProvider: "stripe",
      hasAnyProvider: true,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200, // Still return 200 with defaults
    });
  }
});
