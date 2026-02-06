import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Discord Changelog Notification Webhook
 * 
 * Called after inserting a new platform_update with version_number set.
 * Posts a rich embed to the SellsPay Discord server.
 */

interface NotifyRequest {
  updateId: string;
}

const CATEGORY_EMOJI: Record<string, string> = {
  announcement: "📢",
  feature: "✨",
  improvement: "🔧",
  fix: "🐛",
  marketplace: "🛒",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DISCORD_WEBHOOK_URL = Deno.env.get("DISCORD_CHANGELOG_WEBHOOK_URL");
    if (!DISCORD_WEBHOOK_URL) {
      console.log("Discord webhook not configured, skipping notification");
      return new Response(
        JSON.stringify({ success: false, message: "Discord webhook not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { updateId } = await req.json() as NotifyRequest;

    if (!updateId) {
      return new Response(
        JSON.stringify({ error: "Missing updateId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the update
    const { data: update, error } = await supabase
      .from("platform_updates")
      .select("*")
      .eq("id", updateId)
      .single();

    if (error || !update) {
      console.error("Failed to fetch update:", error);
      return new Response(
        JSON.stringify({ error: "Update not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Skip if already sent
    if (update.discord_sent) {
      return new Response(
        JSON.stringify({ success: true, message: "Already sent" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emoji = CATEGORY_EMOJI[update.category] || "📝";
    const versionDisplay = update.version_number ? `v${update.version_number}` : "";

    // Build Discord embed
    const discordPayload = {
      embeds: [{
        title: `🚀 SellsPay Evolution: ${versionDisplay}`,
        description: update.content?.substring(0, 2000) || update.title,
        color: 0xEE0000, // SellsPay Brand Red
        fields: [
          { 
            name: `${emoji} ${update.title}`, 
            value: update.category.charAt(0).toUpperCase() + update.category.slice(1), 
            inline: true 
          },
          { 
            name: "📋 Type", 
            value: update.version_type 
              ? update.version_type.charAt(0).toUpperCase() + update.version_type.slice(1) 
              : "Update", 
            inline: true 
          },
        ],
        image: update.media_url ? { url: update.media_url } : undefined,
        footer: { 
          text: "Powered by VibeCoder 2.0 Agent Pipeline",
          icon_url: "https://sellspay.lovable.app/favicon.png"
        },
        timestamp: new Date().toISOString(),
      }],
    };

    // Send to Discord
    const discordResponse = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(discordPayload),
    });

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text();
      console.error("Discord webhook failed:", discordResponse.status, errorText);
      throw new Error(`Discord webhook failed: ${discordResponse.status}`);
    }

    // Mark as sent
    await supabase
      .from("platform_updates")
      .update({ discord_sent: true })
      .eq("id", updateId);

    console.log(`[Discord] Sent changelog notification for ${versionDisplay}`);

    return new Response(
      JSON.stringify({ success: true, versionNumber: update.version_number }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Notify changelog error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
