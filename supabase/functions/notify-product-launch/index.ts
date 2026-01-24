import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyProductLaunchRequest {
  productId: string;
  creatorProfileId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { productId, creatorProfileId }: NotifyProductLaunchRequest = await req.json();

    if (!productId || !creatorProfileId) {
      throw new Error("Missing productId or creatorProfileId");
    }

    // Get product details
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("name, slug, cover_image_url")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      throw new Error("Product not found");
    }

    // Get creator details
    const { data: creator, error: creatorError } = await supabase
      .from("profiles")
      .select("username, avatar_url, full_name")
      .eq("id", creatorProfileId)
      .single();

    if (creatorError || !creator) {
      throw new Error("Creator not found");
    }

    // Get all followers of this creator
    const { data: followers, error: followersError } = await supabase
      .from("followers")
      .select("follower_id")
      .eq("following_id", creatorProfileId);

    if (followersError) {
      throw new Error("Failed to fetch followers");
    }

    if (!followers || followers.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No followers to notify", notified: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const followerIds = followers.map((f) => f.follower_id);

    // Get follower profiles with email preferences
    const { data: followerProfiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, email_notifications_enabled, username")
      .in("id", followerIds);

    if (profilesError) {
      throw new Error("Failed to fetch follower profiles");
    }

    const productUrl = `${supabaseUrl.replace('.supabase.co', '')}/product/${product.slug || productId}`;
    const creatorDisplayName = creator.username || creator.full_name || "A creator you follow";
    const notificationMessage = `@${creator.username} has released a new product: ${product.name}`;
    const redirectUrl = `/product/${product.slug || productId}`;

    // Create in-app notifications for all followers
    const notifications = followerProfiles?.map((follower) => ({
      user_id: follower.id,
      type: "product_launch",
      actor_id: creatorProfileId,
      product_id: productId,
      message: notificationMessage,
      redirect_url: redirectUrl,
    })) || [];

    if (notifications.length > 0) {
      const { error: notifyError } = await supabase
        .from("notifications")
        .insert(notifications);

      if (notifyError) {
        console.error("Error creating notifications:", notifyError);
      }
    }

    // Send emails to followers who have email notifications enabled
    let emailsSent = 0;

    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      
      const emailEnabledFollowers = followerProfiles?.filter(
        (f) => f.email && f.email_notifications_enabled !== false
      ) || [];

      for (const follower of emailEnabledFollowers) {
        try {
          await resend.emails.send({
            from: "Loopz <notifications@loopz.co>",
            to: [follower.email!],
            subject: `🚀 ${creatorDisplayName} just dropped something new!`,
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
                        <!-- Header -->
                        <tr>
                          <td style="text-align: center; padding-bottom: 30px;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎉 New Product Alert!</h1>
                          </td>
                        </tr>
                        
                        <!-- Main Content -->
                        <tr>
                          <td style="background: linear-gradient(135deg, #1a1a1d 0%, #0d0d0e 100%); border-radius: 16px; padding: 32px; border: 1px solid #2a2a2d;">
                            ${product.cover_image_url ? `
                            <img src="${product.cover_image_url}" alt="${product.name}" style="width: 100%; height: auto; border-radius: 12px; margin-bottom: 24px; object-fit: cover; max-height: 300px;" />
                            ` : ''}
                            
                            <p style="color: #a1a1aa; font-size: 16px; margin: 0 0 8px 0;">
                              <strong style="color: #10b981;">@${creator.username}</strong> just released:
                            </p>
                            
                            <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 24px 0; font-weight: 600;">
                              ${product.name}
                            </h2>
                            
                            <a href="https://loopz.co/product/${product.slug || productId}" 
                               style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                              Check it out →
                            </a>
                          </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                          <td style="text-align: center; padding-top: 30px;">
                            <p style="color: #52525b; font-size: 13px; margin: 0;">
                              You're receiving this because you follow @${creator.username} on Loopz.
                            </p>
                            <p style="color: #52525b; font-size: 13px; margin: 8px 0 0 0;">
                              <a href="https://loopz.co/settings" style="color: #71717a; text-decoration: underline;">Manage email preferences</a>
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
          emailsSent++;
        } catch (emailError) {
          console.error(`Failed to send email to ${follower.email}:`, emailError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notified: notifications.length,
        emailsSent,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in notify-product-launch:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
