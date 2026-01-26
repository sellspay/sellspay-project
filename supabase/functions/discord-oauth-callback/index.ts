import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[DISCORD-OAUTH-CALLBACK] ${step}${detailsStr}`);
};

serve(async (req) => {
  try {
    logStep("Callback received");

    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");

    // Redirect URL for the frontend
    const frontendUrl = "https://editorsparadise.lovable.app";

    if (error) {
      logStep("OAuth error from Discord", { error, errorDescription });
      return Response.redirect(`${frontendUrl}/login?discord_error=${encodeURIComponent(errorDescription || error)}`);
    }

    if (!code || !state) {
      logStep("Missing code or state");
      return Response.redirect(`${frontendUrl}/login?discord_error=missing_params`);
    }

    // Decode and verify state
    let stateData: { returnTo: string; timestamp: number; nonce: string; linkAccount?: boolean };
    try {
      stateData = JSON.parse(atob(state));
      logStep("State decoded", { returnTo: stateData.returnTo, linkAccount: stateData.linkAccount });
      
      // Check if state is expired (10 minutes)
      if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
        logStep("State expired");
        return Response.redirect(`${frontendUrl}/login?discord_error=session_expired`);
      }
    } catch {
      logStep("Invalid state token");
      return Response.redirect(`${frontendUrl}/login?discord_error=invalid_state`);
    }
    
    const isLinkingAccount = stateData.linkAccount === true;

    const clientId = Deno.env.get("DISCORD_CLIENT_ID");
    const clientSecret = Deno.env.get("DISCORD_CLIENT_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!clientId || !clientSecret) {
      return Response.redirect(`${frontendUrl}/login?discord_error=not_configured`);
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Exchange code for access token
    const redirectUri = `${supabaseUrl}/functions/v1/discord-oauth-callback`;
    
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      logStep("Token exchange failed", { status: tokenResponse.status, error: errorText });
      return Response.redirect(`${frontendUrl}/login?discord_error=token_failed`);
    }

    const tokenData = await tokenResponse.json();
    logStep("Token received", { hasAccessToken: !!tokenData.access_token });

    // Get user info from Discord
    const userInfoResponse = await fetch("https://discord.com/api/users/@me", {
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text();
      logStep("User info fetch failed", { status: userInfoResponse.status, error: errorText });
      return Response.redirect(`${frontendUrl}/login?discord_error=userinfo_failed`);
    }

    const discordUser = await userInfoResponse.json();
    logStep("Discord user info received", { 
      id: discordUser.id,
      username: discordUser.username,
      hasEmail: !!discordUser.email,
    });

    if (!discordUser.email) {
      logStep("No email from Discord");
      return Response.redirect(`${frontendUrl}/login?discord_error=no_email`);
    }

    // Check if user exists in Supabase
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      logStep("Error listing users", { error: listError.message });
      return Response.redirect(`${frontendUrl}/login?discord_error=auth_failed`);
    }

    const existingUser = existingUsers.users.find(u => u.email === discordUser.email);

    let userId: string;
    let isNewUser = false;

    if (existingUser) {
      // User exists with this email
      userId = existingUser.id;
      logStep("Existing user found", { userId, isLinkingAccount });
      
      // Check if this is a linking attempt but user already has Discord linked
      const existingDiscordId = existingUser.user_metadata?.discord_id;
      if (existingDiscordId && existingDiscordId !== discordUser.id) {
        logStep("User already has a different Discord account linked");
        return Response.redirect(`${frontendUrl}/settings?tab=connections&discord_error=different_discord_linked`);
      }

      // Update their metadata with Discord info
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...existingUser.user_metadata,
          discord_id: discordUser.id,
          discord_username: discordUser.username,
          avatar_url: existingUser.user_metadata?.avatar_url || 
            (discordUser.avatar 
              ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
              : null),
        },
      });

      if (updateError) {
        logStep("Error updating user metadata", { error: updateError.message });
      }
    } else {
      // No user with this email exists
      if (isLinkingAccount) {
        // This was a linking attempt but the Discord email doesn't match any existing user
        // This shouldn't normally happen since linking requires being logged in first
        logStep("Linking attempt but no user found with Discord email");
        return Response.redirect(`${frontendUrl}/settings?tab=connections&discord_error=email_mismatch`);
      }
      
      // Create new user
      isNewUser = true;
      const discordAvatarUrl = discordUser.avatar 
        ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
        : null;

      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: discordUser.email,
        email_confirm: true,
        user_metadata: {
          full_name: discordUser.global_name || discordUser.username,
          username: discordUser.username,
          discord_id: discordUser.id,
          discord_username: discordUser.username,
          avatar_url: discordAvatarUrl,
        },
      });

      if (createError) {
        logStep("Error creating user", { error: createError.message });
        return Response.redirect(`${frontendUrl}/login?discord_error=create_failed`);
      }

      userId = newUser.user.id;
      logStep("New user created", { userId });
    }

    // Generate a magic link for the user to sign in
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: discordUser.email,
      options: {
        redirectTo: `${frontendUrl}${stateData.returnTo || "/"}`,
      },
    });

    if (linkError || !linkData.properties?.hashed_token) {
      logStep("Error generating magic link", { error: linkError?.message });
      return Response.redirect(`${frontendUrl}/login?discord_error=link_failed`);
    }

    // Construct the auth callback URL with the token
    const authCallbackUrl = `${supabaseUrl}/auth/v1/verify?token=${linkData.properties.hashed_token}&type=magiclink&redirect_to=${encodeURIComponent(`${frontendUrl}${stateData.returnTo || "/"}`)}`;

    logStep("Discord login successful, redirecting", { userId, isNewUser });

    // Redirect to the Supabase auth verification URL
    return Response.redirect(authCallbackUrl);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return Response.redirect(`https://editorsparadise.lovable.app/login?discord_error=${encodeURIComponent(errorMessage)}`);
  }
});
