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
    const frontendUrl = "https://sellspay.com";

    if (error) {
      logStep("OAuth error from Discord", { error, errorDescription });
      return Response.redirect(`${frontendUrl}/login?discord_error=${encodeURIComponent(errorDescription || error)}`);
    }

    if (!code || !state) {
      logStep("Missing code or state");
      return Response.redirect(`${frontendUrl}/login?discord_error=missing_params`);
    }

    // Decode and verify state
    let stateData: { 
      returnTo: string; 
      timestamp: number; 
      nonce: string; 
      linkAccount?: boolean;
      linkingUserId?: string | null;
    };
    try {
      stateData = JSON.parse(atob(state));
      logStep("State decoded", { 
        returnTo: stateData.returnTo, 
        linkAccount: stateData.linkAccount,
        hasLinkingUserId: !!stateData.linkingUserId 
      });
      
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
    const linkingUserId = stateData.linkingUserId;

    // CRITICAL: If linking, we MUST have a user ID from the state
    if (isLinkingAccount && !linkingUserId) {
      logStep("Linking attempt without user ID - security violation");
      return Response.redirect(`${frontendUrl}/settings?tab=connections&discord_error=invalid_link_request`);
    }

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

    // ========== LINKING FLOW ==========
    if (isLinkingAccount && linkingUserId) {
      logStep("Processing link request", { linkingUserId, discordId: discordUser.id });
      
      // Get the user we're linking to
      const { data: linkingUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(linkingUserId);
      
      if (getUserError || !linkingUser?.user) {
        logStep("Could not find linking user", { error: getUserError?.message });
        return Response.redirect(`${frontendUrl}/settings?tab=connections&discord_error=user_not_found`);
      }
      
      const existingDiscordId = linkingUser.user.user_metadata?.discord_id;
      
      // Check if user already has a different Discord linked
      if (existingDiscordId && existingDiscordId !== discordUser.id) {
        logStep("User already has a different Discord account linked");
        return Response.redirect(`${frontendUrl}/settings?tab=connections&discord_error=different_discord_linked`);
      }
      
      // Check if this Discord account is already linked to a DIFFERENT user
      const { data: allUsers } = await supabaseAdmin.auth.admin.listUsers();
      const userWithThisDiscord = allUsers?.users.find(
        u => u.user_metadata?.discord_id === discordUser.id && u.id !== linkingUserId
      );
      
      if (userWithThisDiscord) {
        logStep("This Discord account is already linked to another user");
        return Response.redirect(`${frontendUrl}/settings?tab=connections&discord_error=discord_already_linked_to_other`);
      }
      
      // Link Discord to the user's account
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(linkingUserId, {
        user_metadata: {
          ...linkingUser.user.user_metadata,
          discord_id: discordUser.id,
          discord_username: discordUser.username,
        },
      });

      if (updateError) {
        logStep("Error updating user metadata", { error: updateError.message });
        return Response.redirect(`${frontendUrl}/settings?tab=connections&discord_error=link_failed`);
      }
      
      logStep("Discord linked successfully to user", { userId: linkingUserId });
      
      // Redirect back to settings - user is already logged in, no magic link needed
      return Response.redirect(`${frontendUrl}/settings?tab=connections&discord_linked=success`);
    }

    // ========== LOGIN/SIGNUP FLOW ==========
    // CRITICAL: Never resolve login by email alone (multiple users can share the same email,
    // and it can route to the wrong account). Resolve by discord_id first.
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      logStep("Error listing users", { error: listError.message });
      return Response.redirect(`${frontendUrl}/login?discord_error=auth_failed`);
    }

    const userByDiscordId = existingUsers.users.find(
      (u) => u.user_metadata?.discord_id === discordUser.id
    );

    // Fallback only used to display friendlier errors (NOT for selecting the account).
    const userByEmail = existingUsers.users.find((u) => u.email === discordUser.email);

    let userId: string;
    let isNewUser = false;
    let loginEmail: string;

    if (userByDiscordId) {
      userId = userByDiscordId.id;
      loginEmail = userByDiscordId.email ?? discordUser.email;
      logStep("User resolved by Discord ID", { userId, loginEmailPresent: !!loginEmail });

      if (!loginEmail) {
        logStep("Resolved user has no email - cannot generate link", { userId });
        return Response.redirect(`${frontendUrl}/login?discord_error=link_failed`);
      }
    } else if (userByEmail) {
      // Email exists but Discord isn't linked to that user
      logStep("Email matched but Discord not linked - login denied", { userId: userByEmail.id });
      return Response.redirect(`${frontendUrl}/login?discord_error=discord_not_linked`);
    } else {
      // No user exists with this email - create new user (signing up with Discord)
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
      loginEmail = discordUser.email;
      logStep("New user created via Discord signup", { userId });
    }

    // Generate a magic link for the resolved account
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: loginEmail,
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
    return Response.redirect(`https://sellspay.com/login?discord_error=${encodeURIComponent(errorMessage)}`);
  }
});
