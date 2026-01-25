import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifySellerEmailRequest {
  apiKey: string;
  supportEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Get the user from the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create client with user token to get current user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create service client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user is a seller from public profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, is_seller")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!profile.is_seller) {
      return new Response(
        JSON.stringify({ error: "Only sellers can configure custom email" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { apiKey, supportEmail }: VerifySellerEmailRequest = await req.json();

    if (!apiKey || !supportEmail) {
      return new Response(
        JSON.stringify({ error: "API key and support email are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(supportEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Test the Resend API key by sending a test email to the seller's own email
    try {
      const resend = new Resend(apiKey);
      
      // Try to send a test email
      const { error: sendError } = await resend.emails.send({
        from: `Test <${supportEmail}>`,
        to: [supportEmail],
        subject: "✅ Your Loopz email integration is working!",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #0a0a0b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0b; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">
                    <tr>
                      <td style="text-align: center; padding-bottom: 30px;">
                        <h1 style="color: #10b981; margin: 0; font-size: 28px;">✅ Email Connected!</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="background: linear-gradient(135deg, #1a1a1d 0%, #0d0d0e 100%); border-radius: 16px; padding: 32px; border: 1px solid #2a2a2d;">
                        <p style="color: #ffffff; font-size: 18px; margin: 0 0 16px 0;">
                          Your Resend integration is now active!
                        </p>
                        <p style="color: #a1a1aa; font-size: 14px; margin: 0 0 24px 0;">
                          Emails to your customers will now be sent from <strong style="color: #10b981;">${supportEmail}</strong>
                        </p>
                        <p style="color: #a1a1aa; font-size: 14px; margin: 0;">
                          This includes:
                        </p>
                        <ul style="color: #a1a1aa; font-size: 14px; padding-left: 20px; margin: 8px 0 0 0;">
                          <li>Purchase receipts</li>
                          <li>Support replies</li>
                          <li>Product update announcements</li>
                        </ul>
                      </td>
                    </tr>
                    <tr>
                      <td style="text-align: center; padding-top: 30px;">
                        <p style="color: #52525b; font-size: 13px; margin: 0;">
                          This is a test email from Loopz.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      });

      if (sendError) {
        console.error("Resend API error:", sendError);
        return new Response(
          JSON.stringify({ 
            error: "Failed to verify API key. Make sure the email address matches your verified Resend domain.",
            details: sendError.message || "Unknown error"
          }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    } catch (resendError: any) {
      console.error("Resend error:", resendError);
      return new Response(
        JSON.stringify({ 
          error: "Invalid Resend API key or email configuration",
          details: resendError.message || "Unknown error"
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Store the API key securely using the database function
    const { data: storeResult, error: storeError } = await supabase.rpc(
      "store_seller_resend_key",
      { p_api_key: apiKey, p_support_email: supportEmail }
    );

    if (storeError) {
      console.error("Error storing API key:", storeError);
      return new Response(
        JSON.stringify({ error: "Failed to store API key securely" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!storeResult?.success) {
      return new Response(
        JSON.stringify({ error: storeResult?.error || "Failed to store API key" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Mark email as verified
    const { error: verifyError } = await supabase.rpc(
      "mark_seller_email_verified",
      { p_user_id: user.id }
    );

    if (verifyError) {
      console.error("Error marking email verified:", verifyError);
      // Non-fatal, continue
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email configuration verified and saved successfully" 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in verify-seller-email:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);