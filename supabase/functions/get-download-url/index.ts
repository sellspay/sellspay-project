import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-DOWNLOAD-URL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Get the auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }
    logStep("User authenticated", { userId: userData.user.id });

    // Get the product ID from the request body
    const { productId } = await req.json();
    if (!productId) {
      throw new Error("Product ID is required");
    }
    logStep("Product ID received", { productId });

    // Get the product details
    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("id, creator_id, download_url, pricing_type")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      throw new Error("Product not found");
    }
    logStep("Product found", { productId: product.id, downloadUrl: product.download_url });

    if (!product.download_url) {
      throw new Error("No download file available for this product");
    }

    // Get user's profile ID
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("user_id", userData.user.id)
      .single();

    if (profileError || !profile) {
      throw new Error("User profile not found");
    }
    logStep("User profile found", { profileId: profile.id });

    // Check authorization
    let isAuthorized = false;

    // 1. Is the user the product creator?
    if (product.creator_id === profile.id) {
      isAuthorized = true;
      logStep("User is product creator - authorized");
    }

    // 2. Has the user purchased the product?
    if (!isAuthorized) {
      const { data: purchase, error: purchaseError } = await supabaseAdmin
        .from("purchases")
        .select("id")
        .eq("product_id", productId)
        .eq("buyer_id", profile.id)
        .eq("status", "completed")
        .maybeSingle();

      if (purchase) {
        isAuthorized = true;
        logStep("User has purchased product - authorized");
      }
    }

    // 3. Is the product free? If so, check if user follows the creator
    if (!isAuthorized && product.pricing_type === "free") {
      // Check if user follows the creator
      const { data: followData } = await supabaseAdmin
        .from("followers")
        .select("id")
        .eq("follower_id", profile.id)
        .eq("following_id", product.creator_id)
        .maybeSingle();
      
      if (followData || product.creator_id === profile.id) {
        isAuthorized = true;
        logStep("Product is free and user follows creator - authorized");
      } else {
        logStep("Product is free but user does not follow creator");
      }
    }

    // 4. Is the user subscribed to a plan that includes this product?
    if (!isAuthorized) {
      // Get plans that include this product
      const { data: planProducts, error: planProductsError } = await supabaseAdmin
        .from("subscription_plan_products")
        .select("plan_id")
        .eq("product_id", productId);

      if (planProducts && planProducts.length > 0) {
        const planIds = planProducts.map(pp => pp.plan_id);
        
        // Check if user is subscribed to any of these plans
        const { data: subscriptions, error: subscriptionError } = await supabaseAdmin
          .from("user_subscriptions")
          .select("id")
          .eq("user_id", profile.id)
          .eq("status", "active")
          .in("plan_id", planIds)
          .maybeSingle();

        if (subscriptions) {
          isAuthorized = true;
          logStep("User is subscribed to qualifying plan - authorized");
        }
      }
    }

    if (!isAuthorized) {
      throw new Error("You are not authorized to download this file. Please follow the creator or purchase the product.");
    }

    // For free products, create a purchase record if it doesn't exist (to track downloads)
    if (product.pricing_type === "free" && product.creator_id !== profile.id) {
      // Check if a purchase record already exists
      const { data: existingPurchase } = await supabaseAdmin
        .from("purchases")
        .select("id")
        .eq("product_id", productId)
        .eq("buyer_id", profile.id)
        .maybeSingle();

      if (!existingPurchase) {
        // Create a purchase record for the free download
        const { error: insertError } = await supabaseAdmin
          .from("purchases")
          .insert({
            product_id: productId,
            buyer_id: profile.id,
            amount_cents: 0,
            platform_fee_cents: 0,
            creator_payout_cents: 0,
            status: "completed",
          });

        if (insertError) {
          logStep("Failed to create purchase record for free download", { error: insertError.message });
        } else {
          logStep("Created purchase record for free download");
        }
      } else {
        logStep("Purchase record already exists for this free download");
      }
    }

    // Generate signed URL
    // The download_url is stored as a path like "user-id/timestamp-filename.zip"
    const filePath = product.download_url;
    
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from("product-files")
      .createSignedUrl(filePath, 300); // 5 minutes expiry

    if (signedUrlError || !signedUrlData) {
      logStep("Failed to generate signed URL", { error: signedUrlError?.message });
      throw new Error("Failed to generate download URL");
    }

    logStep("Signed URL generated successfully");

    return new Response(
      JSON.stringify({ 
        url: signedUrlData.signedUrl,
        expiresIn: 300 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
