import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, userId }: OtpRequest = await req.json();

    if (!email || !userId) {
      return new Response(
        JSON.stringify({ error: "Email and userId are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate a 6-digit OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Delete any existing OTP for this user
    await supabase
      .from('verification_codes')
      .delete()
      .eq('user_id', userId);

    // Insert new OTP
    const { error: insertError } = await supabase
      .from('verification_codes')
      .insert({
        user_id: userId,
        code: otp,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Error storing OTP:", insertError);
      throw new Error("Failed to generate verification code");
    }

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
          <div class="logo">✨ EditorsParadise</div>
          <h2 style="margin: 0 0 16px 0; color: #fff;">Your Verification Code</h2>
          <p class="message">Use the following code to complete your two-factor authentication setup:</p>
          <div class="code-box">
            <div class="code">${otp}</div>
          </div>
          <p class="message">This code will expire in 10 minutes. If you didn't request this code, please ignore this email.</p>
          <div class="footer">
            <p>This email was sent by EditorsParadise. If you have questions, contact support.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Check if Resend is configured
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      
      const { error: emailError } = await resend.emails.send({
        from: "EditorsParadise <onboarding@resend.dev>",
        to: [email],
        subject: "Your EditorsParadise Verification Code",
        html: emailHtml,
      });

      if (emailError) {
        console.error("Resend error:", emailError);
        throw new Error("Failed to send verification email");
      }
    } else {
      // No Resend configured - log for development
      console.log(`[DEV] Verification code for ${email}: ${otp}`);
      // In production, user needs to set up RESEND_API_KEY
    }

    return new Response(
      JSON.stringify({ success: true, message: "Verification code sent" }),
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
