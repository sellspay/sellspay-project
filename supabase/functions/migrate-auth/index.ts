import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Source database (your existing Base44/Supabase)
    const sourceUrl = Deno.env.get("SOURCE_SUPABASE_URL");
    const sourceKey = Deno.env.get("SOURCE_SUPABASE_SERVICE_ROLE_KEY");

    // Destination database (this project)
    const destUrl = Deno.env.get("SUPABASE_URL");
    const destKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!sourceUrl || !sourceKey) {
      return new Response(
        JSON.stringify({ error: "Source database credentials not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sourceClient = createClient(sourceUrl, sourceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    const destClient = createClient(destUrl!, destKey!, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { action } = await req.json();

    if (action === "preview") {
      // Preview auth users from source
      const { data, error } = await sourceClient.auth.admin.listUsers();
      
      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          users: {
            count: data.users?.length || 0,
            sample: data.users?.slice(0, 5).map(u => ({
              id: u.id,
              email: u.email,
              created_at: u.created_at,
              last_sign_in_at: u.last_sign_in_at,
            })) || [],
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "migrate") {
      const results = { success: 0, failed: 0, errors: [] as string[] };

      // Get all users from source
      const { data: sourceData, error: listError } = await sourceClient.auth.admin.listUsers();
      
      if (listError) {
        return new Response(
          JSON.stringify({ error: listError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const sourceUsers = sourceData.users || [];

      for (const user of sourceUsers) {
        try {
          // Create user in destination with same ID if possible
          // Note: We'll use a placeholder password - users will need to reset
          const { error: createError } = await destClient.auth.admin.createUser({
            email: user.email!,
            email_confirm: true,
            user_metadata: user.user_metadata,
            app_metadata: user.app_metadata,
          });

          if (createError) {
            // User might already exist
            if (createError.message.includes("already exists") || createError.message.includes("already registered")) {
              results.success++;
              continue;
            }
            results.failed++;
            results.errors.push(`${user.email}: ${createError.message}`);
          } else {
            results.success++;
          }
        } catch (err) {
          results.failed++;
          const message = err instanceof Error ? err.message : "Unknown error";
          results.errors.push(`${user.email}: ${message}`);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          results,
          note: "Users migrated. They can log in using 'Forgot Password' to set a new password, or use magic link if enabled."
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use 'preview' or 'migrate'" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Auth migration error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
