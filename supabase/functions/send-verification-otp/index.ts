import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";
import { Resend } from "https://esm.sh/resend@2.0.0";
import * as jose from "https://deno.land/x/jose@v5.2.2/index.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OtpRequest {
  email: string;
  userId: string;
}

// Generate a 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const jwtSecret = supabaseServiceKey; // Use service key as JWT secret

    const { email, userId }: OtpRequest = await req.json();

    if (!email || !userId) {
      return new Response(
        JSON.stringify({ error: "Email and userId are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate a 6-digit OTP
    const otp = generateOTP();
    const expiresAt = Math.floor(Date.now() / 1000) + (10 * 60); // 10 minutes from now

    // Create a signed JWT containing the OTP hash (not the OTP itself)
    // The OTP is sent via email, the token is used for verification
    // IMPORTANT: Use trimmed OTP to ensure consistency
    const trimmedOtp = otp.trim();
    const otpHash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(trimmedOtp + userId)
    );
    const otpHashHex = Array.from(new Uint8Array(otpHash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    console.log("OTP generated:", {
      userId,
      otpLength: trimmedOtp.length,
      hashPrefix: otpHashHex.substring(0, 10)
    });

    // Create JWT with the hash - this is what we'll verify against
    const secret = new TextEncoder().encode(jwtSecret);
    const verificationToken = await new jose.SignJWT({ 
      sub: userId,
      hash: otpHashHex,
      purpose: 'mfa_verification'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiresAt)
      .sign(secret);

    // Build branded email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; color: #ffffff; margin: 0; padding: 40px; }
          .container { max-width: 480px; margin: 0 auto; background: #1a1a1a; border-radius: 12px; padding: 40px; border: 1px solid #333; }
          .logo { font-size: 24px; font-weight: bold; color: #a855f7; margin-bottom: 24px; }
          .code-box { background: #0a0a0a; border: 2px solid #a855f7; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0; }
          .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #a855f7; }
          .message { color: #999; font-size: 14px; line-height: 1.6; }
          .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #333; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">✨ Sellspay</div>
          <h2 style="margin: 0 0 16px 0; color: #fff;">Your Verification Code</h2>
          <p class="message">Use the following code to complete your two-factor authentication setup:</p>
          <div class="code-box">
            <div class="code">${otp}</div>
          </div>
          <p class="message">This code will expire in 10 minutes. If you didn't request this code, please ignore this email.</p>
          <div class="footer">
            <p>This email was sent by Sellspay. If you have questions, contact support.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      
      const { error: emailError } = await resend.emails.send({
        from: "Sellspay <noreply@sellspay.com>",
        to: [email],
        subject: "Your Sellspay Verification Code",
        html: emailHtml,
      });

      if (emailError) {
        console.error("Resend error:", emailError);
        throw new Error("Failed to send verification email");
      }
    } else {
      console.log(`[DEV] Verification code for ${email}: ${otp}`);
    }

    // Return the verification token - client stores this temporarily
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Verification code sent",
        verificationToken // Client needs this to verify the code
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-verification-otp:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);