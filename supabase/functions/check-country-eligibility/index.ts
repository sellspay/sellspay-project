import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CHECK-COUNTRY-ELIGIBILITY] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    const { country_code } = await req.json();

    if (!country_code) {
      return new Response(
        JSON.stringify({ error: "country_code is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Checking country eligibility", { country_code });

    // Query country eligibility
    const { data: eligibility, error } = await supabaseClient
      .from("country_eligibility")
      .select("country_code, country_name, connect_eligible, notes")
      .eq("country_code", country_code.toUpperCase())
      .maybeSingle();

    if (error) {
      logStep("Database error", { error: error.message });
      throw new Error(`Database error: ${error.message}`);
    }

    // If country not found, default to MOR-only
    if (!eligibility) {
      logStep("Country not found, defaulting to MOR", { country_code });
      return new Response(
        JSON.stringify({
          country_code: country_code.toUpperCase(),
          country_name: "Unknown",
          connect_eligible: false,
          seller_mode: "MOR",
          notes: "Country not in database - using Platform MoR mode",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = {
      ...eligibility,
      seller_mode: eligibility.connect_eligible ? "CONNECT" : "MOR",
    };

    logStep("Eligibility found", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logStep("ERROR", { message });
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
