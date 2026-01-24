import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerifyRequest {
  userId: string;
  code: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, code }: VerifyRequest = await req.json();

    if (!userId || !code) {
      return new Response(
        JSON.stringify({ error: "User ID and code are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Retrieve the stored OTP
    const { data: verificationData, error: fetchError } = await supabase
      .from('verification_codes')
      .select('code, expires_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching OTP:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to verify code" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!verificationData) {
      return new Response(
        JSON.stringify({ error: "No verification code found. Please request a new code." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if expired
    const expiresAt = new Date(verificationData.expires_at);
    if (new Date() > expiresAt) {
      // Delete expired code
      await supabase
        .from('verification_codes')
        .delete()
        .eq('user_id', userId);
      
      return new Response(
        JSON.stringify({ error: "Verification code has expired. Please request a new one." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify the code
    if (verificationData.code !== code) {
      return new Response(
        JSON.stringify({ error: "Invalid verification code" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Code is valid - delete it and mark MFA as enabled
    await supabase
      .from('verification_codes')
      .delete()
      .eq('user_id', userId);

    // Update profile to mark MFA as enabled
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ mfa_enabled: true })
      .eq('user_id', userId);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to enable 2FA" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Two-factor authentication enabled!" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in verify-otp:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
