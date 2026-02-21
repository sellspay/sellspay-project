import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");

    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user if authenticated
    let userId: string | null = null;
    let userEmail: string | null = null;
    if (authHeader) {
      const anonClient = createClient(
        supabaseUrl,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user } } = await anonClient.auth.getUser();
      if (user) {
        userId = user.id;
        userEmail = user.email ?? null;
      }
    }

    const { subject, category, message } = await req.json();

    // Validate
    if (!subject || typeof subject !== "string" || subject.trim().length === 0) {
      throw new Error("Subject is required");
    }
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      throw new Error("Message is required");
    }
    if (subject.length > 200) throw new Error("Subject too long");
    if (message.length > 2000) throw new Error("Message too long");

    // Save to database
    const { error: dbError } = await supabase.from("support_tickets").insert({
      user_id: userId,
      subject: subject.trim(),
      category: category?.trim() || null,
      message: message.trim(),
    });

    if (dbError) {
      console.error("DB error:", dbError);
      throw new Error("Failed to save ticket");
    }

    // Send email notifications
    if (resendKey) {
      const resend = new Resend(resendKey);

      // 1. Notify team
      await resend.emails.send({
        from: "SellsPay Support <noreply@sellspay.com>",
        to: ["sellspay@gmail.com"],
        reply_to: userEmail ?? undefined,
        subject: `[Support Ticket] ${subject.trim()}`,
        html: `
          <h2>New Support Ticket</h2>
          <p><strong>From:</strong> ${userEmail ?? "Anonymous"}</p>
          <p><strong>Category:</strong> ${category || "Uncategorized"}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <hr />
          <p>${message.replace(/\n/g, "<br />")}</p>
          <p style="margin-top: 24px; color: #888; font-size: 12px;">Hit Reply to respond directly to this user.</p>
        `,
      });

      // 2. Send confirmation to the user
      if (userEmail) {
        await resend.emails.send({
          from: "SellsPay Support <noreply@sellspay.com>",
          to: [userEmail],
          subject: `We received your ticket: ${subject.trim()}`,
          html: `
            <h2>We've received your support request</h2>
            <p>Hi there,</p>
            <p>Thanks for reaching out. We've received your ticket and will get back to you within 24 hours (primarily on weekdays).</p>
            <hr />
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Category:</strong> ${category || "Uncategorized"}</p>
            <p><strong>Your message:</strong></p>
            <p>${message.replace(/\n/g, "<br />")}</p>
            <hr />
            <p style="color: #888; font-size: 12px;">This is an automated confirmation from SellsPay Support. Please do not reply to this email.</p>
          `,
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
