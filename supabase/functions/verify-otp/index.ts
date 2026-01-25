import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";
import * as jose from "https://deno.land/x/jose@v5.2.2/index.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerifyRequest {
  userId: string;
  code: string;
  verificationToken: string; // JWT token from send-verification-otp
  purpose?: 'login' | 'enable_mfa';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const jwtSecret = supabaseServiceKey;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, code, verificationToken, purpose = 'enable_mfa' }: VerifyRequest = await req.json();

    if (!userId || !code || !verificationToken) {
      return new Response(
        JSON.stringify({ error: "User ID, code, and verification token are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify the JWT token
    const secret = new TextEncoder().encode(jwtSecret);
    let payload: jose.JWTPayload;
    
    try {
      const { payload: verifiedPayload } = await jose.jwtVerify(verificationToken, secret);
      payload = verifiedPayload;
    } catch (jwtError) {
      console.error("JWT verification failed:", jwtError);
      return new Response(
        JSON.stringify({ error: "Verification code has expired. Please request a new one." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate the token is for this user
    if (payload.sub !== userId) {
      return new Response(
        JSON.stringify({ error: "Invalid verification token" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate the purpose
    if (payload.purpose !== 'mfa_verification') {
      return new Response(
        JSON.stringify({ error: "Invalid token purpose" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Hash the provided code with userId and compare
    const providedHash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(code + userId)
    );
    const providedHashHex = Array.from(new Uint8Array(providedHash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (providedHashHex !== payload.hash) {
      return new Response(
        JSON.stringify({ error: "Invalid verification code" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Code is valid! If purpose is to enable MFA, update the profile
    if (purpose === 'enable_mfa') {
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
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: purpose === 'enable_mfa' 
          ? "Two-factor authentication enabled!" 
          : "Verification successful!"
      }),
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
