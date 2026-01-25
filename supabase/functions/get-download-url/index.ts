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

// Extract original filename from storage path
// Format: {creator_id}/{timestamp}-{original_filename}
const extractFilename = (downloadUrl: string): string => {
  try {
    // Get the last part of the path
    let path = downloadUrl;
    
    // If it's a full URL, extract the path
    if (downloadUrl.includes('/product-files/')) {
      const match = downloadUrl.match(/\/product-files\/(.+)$/);
      if (match) {
        path = decodeURIComponent(match[1]);
      }
    } else if (downloadUrl.includes('/product-media/')) {
      const match = downloadUrl.match(/\/product-media\/(.+)$/);
      if (match) {
        path = decodeURIComponent(match[1]);
      }
    }
    
    // Get just the filename portion (after last /)
    const parts = path.split('/');
    const filenameWithTimestamp = parts[parts.length - 1];
    
    // Remove timestamp prefix if present (format: timestamp-)
    // Timestamp is typically 13 digits followed by dash
    const timestampMatch = filenameWithTimestamp.match(/^\d{13}-(.+)$/);
    if (timestampMatch) {
      return timestampMatch[1];
    }
    
    // Try another common format: uuid-filename
    const uuidMatch = filenameWithTimestamp.match(/^[a-f0-9-]{36}-(.+)$/i);
    if (uuidMatch) {
      return uuidMatch[1];
    }
    
    return filenameWithTimestamp;
  } catch {
    return 'download';
  }
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
      .select("id, creator_id, download_url, pricing_type, original_filename")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      throw new Error("Product not found");
    }
    logStep("Product found", { productId: product.id, downloadUrl: product.download_url, originalFilename: product.original_filename });

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
    const isOwner = product.creator_id === profile.id;

    // 1. Is the user the product creator?
    if (isOwner) {
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

    // Check download rate limit (2 per week per product) - skip for owners
    if (!isOwner) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: recentDownloads, error: downloadCountError } = await supabaseAdmin
        .from("product_downloads")
        .select("id, downloaded_at")
        .eq("user_id", profile.id)
        .eq("product_id", productId)
        .gte("downloaded_at", sevenDaysAgo.toISOString())
        .order("downloaded_at", { ascending: false });
      
      if (downloadCountError) {
        logStep("Error checking download count", { error: downloadCountError.message });
      } else {
        const downloadCount = recentDownloads?.length || 0;
        logStep("Download count check", { count: downloadCount, limit: 2 });
        
        if (downloadCount >= 2) {
          // Calculate when they can download again
          const oldestDownload = recentDownloads[recentDownloads.length - 1];
          const oldestDate = new Date(oldestDownload.downloaded_at);
          const canDownloadAgain = new Date(oldestDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          const daysLeft = Math.ceil((canDownloadAgain.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
          
          throw new Error(`Download limit reached (2 per week). You can download again in ${daysLeft} day(s).`);
        }
      }
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

    // Use original_filename if stored (new uploads), otherwise fallback to extracting from path
    const filename = product.original_filename || extractFilename(product.download_url);
    logStep("Resolved filename", { filename, hasStoredFilename: !!product.original_filename });

    // Record the download event (only for non-owners)
    if (!isOwner) {
      const { error: recordError } = await supabaseAdmin
        .from("product_downloads")
        .insert({
          user_id: profile.id,
          product_id: productId,
        });
      
      if (recordError) {
        logStep("Failed to record download", { error: recordError.message });
      } else {
        logStep("Download recorded successfully");
      }
    }

    // Generate signed URL or return public URL
    // The download_url can be:
    // 1. A relative path for product-files bucket (e.g., "user-id/timestamp-filename.zip")
    // 2. A full URL from product-media bucket (legacy public storage)
    const downloadUrl = product.download_url;
    
    // Check if it's a full URL (legacy public storage)
    if (downloadUrl.startsWith("http://") || downloadUrl.startsWith("https://")) {
      // Check if it's from product-media bucket (public) or product-files bucket
      if (downloadUrl.includes("/product-media/")) {
        // Legacy public URL - return as-is
        logStep("Returning public URL directly (legacy product-media)");
        return new Response(
          JSON.stringify({ 
            url: downloadUrl,
            filename: filename,
            expiresIn: 0 // No expiry for public URLs
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      } else if (downloadUrl.includes("/product-files/")) {
        // Extract the path from the full URL for product-files bucket
        const pathMatch = downloadUrl.match(/\/product-files\/(.+)$/);
        if (pathMatch && pathMatch[1]) {
          const filePath = decodeURIComponent(pathMatch[1]);
          logStep("Extracted path from full URL", { filePath });
          
          const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
            .from("product-files")
            .createSignedUrl(filePath, 300);

          if (signedUrlError || !signedUrlData) {
            logStep("Failed to generate signed URL", { error: signedUrlError?.message });
            throw new Error("Failed to generate download URL");
          }
          
          logStep("Signed URL generated successfully");
          return new Response(
            JSON.stringify({ 
              url: signedUrlData.signedUrl,
              filename: filename,
              expiresIn: 300 
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            }
          );
        }
      }
      // Unknown full URL format - return as-is
      logStep("Unknown URL format, returning as-is");
      return new Response(
        JSON.stringify({ 
          url: downloadUrl,
          filename: filename,
          expiresIn: 0
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
    
    // Relative path - generate signed URL from product-files bucket
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from("product-files")
      .createSignedUrl(downloadUrl, 300); // 5 minutes expiry

    if (signedUrlError || !signedUrlData) {
      logStep("Failed to generate signed URL", { error: signedUrlError?.message });
      throw new Error("Failed to generate download URL");
    }

    logStep("Signed URL generated successfully");

    return new Response(
      JSON.stringify({ 
        url: signedUrlData.signedUrl,
        filename: filename,
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
