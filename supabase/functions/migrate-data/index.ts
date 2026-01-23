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

    const sourceClient = createClient(sourceUrl, sourceKey);
    const destClient = createClient(destUrl!, destKey!);

    const { action } = await req.json();

    if (action === "preview") {
      // Preview what data exists in source
      const { data: products, error: productsError } = await sourceClient
        .from("products")
        .select("*");

      const { data: profiles, error: profilesError } = await sourceClient
        .from("profiles")
        .select("*");

      // Check for follows/likes/comments tables
      const { data: creatorFollows, error: creatorFollowsError } = await sourceClient
        .from("creator_follows")
        .select("*")
        .limit(5);

      const { data: followers, error: followersError } = await sourceClient
        .from("followers")
        .select("*")
        .limit(5);

      const { data: follows, error: followsError } = await sourceClient
        .from("follows")
        .select("*")
        .limit(5);

      const { data: likes, error: likesError } = await sourceClient
        .from("likes")
        .select("*")
        .limit(5);

      const { data: productLikes, error: productLikesError } = await sourceClient
        .from("product_likes")
        .select("*")
        .limit(5);

      const { data: comments, error: commentsError } = await sourceClient
        .from("comments")
        .select("*")
        .limit(5);

      return new Response(
        JSON.stringify({
          products: {
            count: products?.length || 0,
            sample: products?.slice(0, 3) || [],
            error: productsError?.message,
          },
          profiles: {
            count: profiles?.length || 0,
            sample: profiles?.slice(0, 3) || [],
            error: profilesError?.message,
          },
          creator_follows: {
            count: creatorFollows?.length || 0,
            sample: creatorFollows || [],
            error: creatorFollowsError?.message,
          },
          followers: {
            count: followers?.length || 0,
            sample: followers || [],
            error: followersError?.message,
          },
          follows: {
            count: follows?.length || 0,
            sample: follows || [],
            error: followsError?.message,
          },
          likes: {
            count: likes?.length || 0,
            sample: likes || [],
            error: likesError?.message,
          },
          product_likes: {
            count: productLikes?.length || 0,
            sample: productLikes || [],
            error: productLikesError?.message,
          },
          comments: {
            count: comments?.length || 0,
            sample: comments || [],
            error: commentsError?.message,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "migrate") {
      const results = { profiles: { success: 0, failed: 0 }, products: { success: 0, failed: 0 } };

      // Migrate profiles first
      const { data: sourceProfiles } = await sourceClient.from("profiles").select("*");
      
      if (sourceProfiles) {
        for (const profile of sourceProfiles) {
          // Use profile.id as user_id if user_id is null (Base44 migration)
          const userId = profile.user_id || profile.id;
          
          const { error } = await destClient.from("profiles").upsert({
            id: profile.id,
            user_id: userId,
            username: profile.username,
            email: profile.email,
            full_name: profile.full_name,
            bio: profile.bio,
            avatar_url: profile.avatar_url,
            website: profile.website,
            social_links: profile.social_links,
            is_creator: profile.is_creator,
            phone: profile.phone,
            created_at: profile.created_at,
            updated_at: profile.updated_at,
          }, { onConflict: 'id' });

          if (error) {
            console.error("Profile migration error:", error);
            results.profiles.failed++;
          } else {
            results.profiles.success++;
          }
        }
      }

      // Migrate products
      const { data: sourceProducts } = await sourceClient.from("products").select("*");
      
      if (sourceProducts) {
        for (const product of sourceProducts) {
          const { error } = await destClient.from("products").upsert({
            id: product.id,
            name: product.name,
            description: product.description,
            price_cents: product.price_cents,
            currency: product.currency,
            pricing_type: product.pricing_type,
            subscription_price_cents: product.subscription_price_cents,
            cover_image_url: product.cover_image_url,
            preview_video_url: product.preview_video_url,
            youtube_url: product.youtube_url,
            download_url: product.download_url,
            product_type: product.product_type,
            tags: product.tags,
            featured: product.featured,
            status: product.status,
            creator_id: product.creator_id,
            created_at: product.created_at,
            updated_at: product.updated_at,
            // New columns
            created_by: product.created_by,
            locked: product.locked,
            attachments: product.attachments,
            benefits: product.benefits,
            duration_label: product.duration_label,
            excerpt: product.excerpt,
          }, { onConflict: 'id' });

          if (error) {
            console.error("Product migration error:", error);
            results.products.failed++;
          } else {
            results.products.success++;
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true, results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use 'preview' or 'migrate'" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Migration error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
