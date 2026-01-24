import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type EmailType = "purchase_receipt" | "support_reply" | "product_announcement";

interface SendSellerEmailRequest {
  sellerUserId: string;
  recipientEmail: string;
  emailType: EmailType;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const platformResendKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      sellerUserId, 
      recipientEmail, 
      emailType, 
      subject, 
      htmlContent,
      textContent 
    }: SendSellerEmailRequest = await req.json();

    if (!sellerUserId || !recipientEmail || !emailType || !subject || !htmlContent) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get seller's email configuration
    const { data: emailConfig, error: configError } = await supabase.rpc(
      "get_seller_email_config",
      { p_seller_user_id: sellerUserId }
    );

    if (configError) {
      console.error("Error getting seller email config:", configError);
    }

    let fromEmail: string;
    let resendApiKey: string | undefined;
    let usedSellerEmail = false;

    // Check if seller has a verified custom email setup
    if (emailConfig?.has_api_key && emailConfig?.verified && emailConfig?.support_email) {
      // Get the seller's Resend API key from vault
      const { data: sellerApiKey, error: keyError } = await supabase.rpc(
        "get_seller_resend_key",
        { p_seller_user_id: sellerUserId }
      );

      if (!keyError && sellerApiKey) {
        resendApiKey = sellerApiKey;
        fromEmail = emailConfig.support_email;
        usedSellerEmail = true;
      } else {
        // Fall back to platform email
        resendApiKey = platformResendKey;
        fromEmail = "Loopz <notifications@loopz.co>";
      }
    } else {
      // Use platform default
      resendApiKey = platformResendKey;
      fromEmail = "Loopz <notifications@loopz.co>";
    }

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "No email configuration available" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get seller profile for branding (if using platform email)
    let sellerName = "A seller on Loopz";
    if (!usedSellerEmail) {
      const { data: sellerProfile } = await supabase
        .from("profiles")
        .select("username, full_name")
        .eq("user_id", sellerUserId)
        .single();
      
      if (sellerProfile) {
        sellerName = sellerProfile.full_name || sellerProfile.username || sellerName;
        // Add seller branding to "from" when using platform email
        fromEmail = `${sellerName} via Loopz <notifications@loopz.co>`;
      }
    }

    // Send the email
    const resend = new Resend(resendApiKey);
    
    const emailPayload: any = {
      from: fromEmail,
      to: [recipientEmail],
      subject: subject,
      html: htmlContent,
    };

    if (textContent) {
      emailPayload.text = textContent;
    }

    const { data: emailResult, error: sendError } = await resend.emails.send(emailPayload);

    if (sendError) {
      console.error("Failed to send email:", sendError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to send email",
          details: sendError.message || "Unknown error",
          usedSellerEmail
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: emailResult?.id,
        usedSellerEmail,
        fromEmail: usedSellerEmail ? emailConfig.support_email : "platform default"
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-seller-email:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
