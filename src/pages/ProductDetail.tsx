import { useState, useEffect, useRef } from "react";
import { useParams, Link, useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Download, Share2, Heart, MessageCircle, Calendar, Loader2, Pencil, Trash2, FileIcon, Send, Lock, ChevronDown, ChevronUp, UserPlus, Reply, Bookmark, Flame, TrendingUp, Crown, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { GifPicker } from "@/components/comments/GifPicker";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { cn } from "@/lib/utils";
import { CreatorFollowDialog } from "@/components/product/CreatorFollowDialog";
import { createNotification, checkFollowCooldown } from "@/lib/notifications";
import { getFileTypeIcon, getFileTypeLabel } from "@/lib/fileTypeIcons";
import { SubscriptionPromotion } from "@/components/product/SubscriptionPromotion";
import { SubscriptionBadge } from "@/components/product/SubscriptionBadge";
import { useProductViewTracking } from "@/hooks/useViewTracking";
import { PaymentMethodDialog } from "@/components/checkout/PaymentMethodDialog";
import { useFileDownloadProgress } from "@/hooks/useFileDownloadProgress";
import { DownloadProgressOverlay } from "@/components/product/DownloadProgressOverlay";
import { useDownloadLimitCountdown } from "@/hooks/useDownloadLimitCountdown";
import { AttachmentsSection } from "@/components/product/AttachmentsSection";

interface Product {
  id: string;
  slug: string | null;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  preview_video_url: string | null;
  youtube_url: string | null;
  price_cents: number | null;
  pricing_type: string | null;
  subscription_access: string | null;
  currency: string | null;
  product_type: string | null;
  attachments: any;
  download_url: string | null;
  created_at: string | null;
  creator_id: string | null;
  creator: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    verified: boolean | null;
  } | null;
}

interface CommentUser {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  verified: boolean | null;
}

interface CommentLike {
  id: string;
  user_id: string;
  user?: CommentUser | null;
}

interface Comment {
  id: string;
  content: string;
  gif_url: string | null;
  created_at: string;
  user_id: string;
  parent_comment_id: string | null;
  is_pinned: boolean;
  user: CommentUser | null;
  likes: CommentLike[];
  replies?: Comment[];
}

interface RelatedProduct {
  id: string;
  name: string;
  cover_image_url: string | null;
  youtube_url: string | null;
  preview_video_url: string | null;
  price_cents: number | null;
  currency: string | null;
}


const productTypeLabels: Record<string, string> = {
  preset: "Preset Pack",
  lut: "LUT Pack",
  sfx: "Sound Effects",
  music: "Music",
  template: "Template",
  overlay: "Overlay",
  font: "Font",
  tutorial: "Tutorial",
  project_file: "Project File",
  transition: "Transition Pack",
  color_grading: "Color Grading",
  motion_graphics: "Motion Graphics",
  other: "Other",
};

// Helper to generate YouTube thumbnail URL
const getYouTubeThumbnail = (youtubeUrl: string | null): string | null => {
  if (!youtubeUrl) return null;
  let videoId = youtubeUrl;
  if (youtubeUrl.includes('youtube.com/watch')) {
    const url = new URL(youtubeUrl);
    videoId = url.searchParams.get('v') || youtubeUrl;
  } else if (youtubeUrl.includes('youtu.be/')) {
    videoId = youtubeUrl.split('youtu.be/')[1]?.split('?')[0] || youtubeUrl;
  } else if (youtubeUrl.includes('youtube.com/embed/')) {
    videoId = youtubeUrl.split('embed/')[1]?.split('?')[0] || youtubeUrl;
  }
  videoId = videoId.split('?')[0].split('&')[0];
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};

// UUID regex for checking if idOrSlug is a UUID
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function ProductDetail() {
  const { idOrSlug } = useParams<{ idOrSlug?: string }>();
  
  // Determine if it's a UUID or a slug
  const isUUID = idOrSlug ? UUID_REGEX.test(idOrSlug) : false;
  const id = isUUID ? idOrSlug : undefined;
  const slug = !isUUID ? idOrSlug : undefined;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [purchasing, setPurchasing] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [userProfileId, setUserProfileId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [isFollowingCreator, setIsFollowingCreator] = useState(false);
  const [showFollowDialog, setShowFollowDialog] = useState(false);
  const [followingCreator, setFollowingCreator] = useState(false);
  const [isCreatorAdmin, setIsCreatorAdmin] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  
  // Download progress hook
  const { 
    isDownloading: isDownloadingWithProgress, 
    progress: downloadProgress, 
    downloadWithProgress, 
    cancelDownload, 
    clearProgress: clearDownloadProgress 
  } = useFileDownloadProgress();
  
  // Multi-file download tracking
  const [downloadFileIndex, setDownloadFileIndex] = useState(0);
  const [downloadTotalFiles, setDownloadTotalFiles] = useState(0);
  
  // Subscription benefits state
  const [planBenefits, setPlanBenefits] = useState<{
    planId: string;
    planName: string;
    planPriceCents: number;
    planCurrency: string;
    isFree: boolean;
    discountPercent: number | null;
    discountType: string | null;
  }[]>([]);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [activeSubscriptionPlanId, setActiveSubscriptionPlanId] = useState<string | null>(null);
  const [isSubscriptionOnly, setIsSubscriptionOnly] = useState(false);
  
  // Featured Products
  const [featuredProducts, setFeaturedProducts] = useState<RelatedProduct[]>([]);
  
  // Comments
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [showAllComments, setShowAllComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [selectedGif, setSelectedGif] = useState<string | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [likingComment, setLikingComment] = useState<string | null>(null);
  
  // Related
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);

  // Track product view for analytics
  useProductViewTracking(product?.id);

  // Fetch user's profile ID for likes
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setUserProfileId(null);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      setUserProfileId(data?.id || null);
    };
    fetchUserProfile();
  }, [user]);

  // Track if we just completed a purchase (for triggering download limit refresh)
  const [justPurchased, setJustPurchased] = useState(false);

  // Check for purchase success from URL
  useEffect(() => {
    const purchaseStatus = searchParams.get("purchase");
    if (purchaseStatus === "success") {
      toast.success("Purchase successful! Thank you for your order.");
      setHasPurchased(true);
      setJustPurchased(true);
      // Clear the URL params but keep the current path
      window.history.replaceState({}, "", window.location.pathname);
    } else if (purchaseStatus === "canceled") {
      toast.info("Purchase was canceled");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);

  // Use the live countdown hook for download limits
  const { 
    limitInfo: downloadLimitInfo, 
    refetch: refetchDownloadLimit,
    getCountdownString 
  } = useDownloadLimitCountdown(product?.id, userProfileId, isOwner);

  // Refresh download limit info after purchase when product is loaded
  useEffect(() => {
    if (justPurchased && product?.id && userProfileId) {
      refetchDownloadLimit();
      setJustPurchased(false);
    }
  }, [justPurchased, product?.id, userProfileId, refetchDownloadLimit]);

  // Fetch product when route changes (id or slug). Keep userProfileId in deps so owner-state
  // and creator badges can update once the current user's profile is known.
  useEffect(() => {
    const productIdentifier = id || slug;
    if (productIdentifier) {
      fetchProduct();
    }
  }, [id, slug, userProfileId]);

  // IMPORTANT: Engagement fetches must run *after* we have a concrete product id.
  // When visiting via slug, product.id is only available after fetchProduct completes.
  useEffect(() => {
    const productId = id || product?.id;
    if (!productId) return;

    fetchLikes();
    fetchComments();
    fetchSavedStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, product?.id, userProfileId]);

  // Check if user has purchased this product (after product is loaded)
  useEffect(() => {
    const checkPurchaseStatus = async () => {
      if (!product?.id || !userProfileId) {
        return;
      }
      
      try {
        const { data } = await supabase
          .from("purchases")
          .select("id")
          .eq("product_id", product.id)
          .eq("buyer_id", userProfileId)
          .eq("status", "completed")
          .maybeSingle();
        
        setHasPurchased(!!data);
      } catch (error) {
        console.error("Error checking purchase status:", error);
      }
    };
    
    checkPurchaseStatus();
  }, [product?.id, userProfileId]);

  // Check if user follows the creator
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!userProfileId || !product?.creator?.id || isOwner) {
        setIsFollowingCreator(false);
        return;
      }
      
      const { data } = await supabase
        .from("followers")
        .select("id")
        .eq("follower_id", userProfileId)
        .eq("following_id", product.creator.id)
        .maybeSingle();
      
      setIsFollowingCreator(!!data);
    };
    checkFollowStatus();
  }, [userProfileId, product?.creator?.id, isOwner]);

  // Fetch subscription plan benefits for this product
  useEffect(() => {
    const fetchSubscriptionBenefits = async () => {
      const productId = id || product?.id;
      if (!productId) return;

      try {
        // Check if product should be treated as subscription-only
        // True if:
        // 1. Explicitly subscription_only pricing type
        // 2. subscription_access is subscription_only  
        // 3. pricing_type is 'paid' but has no valid price (< $4.99 minimum)
        //    AND has subscription_access (meaning subscription is the only valid purchase path)
        const isExplicitlySubscriptionOnly = 
          product?.pricing_type === 'subscription_only' || 
          product?.subscription_access === 'subscription_only';
        
        // Products with 'both' access but no valid direct price should be treated as subscription-only
        const hasBothAccessButNoPrice = 
          product?.subscription_access === 'both' && 
          (!product?.price_cents || product.price_cents < 499);
        
        setIsSubscriptionOnly(isExplicitlySubscriptionOnly || hasBothAccessButNoPrice);

        // Fetch all plans that include this product with their benefits
        const { data: planProducts, error } = await supabase
          .from('subscription_plan_products')
          .select(`
            plan_id,
            is_free,
            discount_percent,
            discount_type,
            creator_subscription_plans!inner (
              id,
              name,
              price_cents,
              currency,
              is_active,
              creator_id
            )
          `)
          .eq('product_id', productId);

        if (error) {
          console.error('Error fetching subscription benefits:', error);
          return;
        }

        if (planProducts && planProducts.length > 0) {
          const benefits = planProducts
            .filter((pp: any) => pp.creator_subscription_plans?.is_active)
            .map((pp: any) => ({
              planId: pp.plan_id,
              planName: pp.creator_subscription_plans.name,
              planPriceCents: pp.creator_subscription_plans.price_cents,
              planCurrency: pp.creator_subscription_plans.currency,
              isFree: pp.is_free || false,
              discountPercent: pp.discount_percent,
              discountType: pp.discount_type,
            }));
          setPlanBenefits(benefits);
        }
      } catch (error) {
        console.error('Error fetching subscription benefits:', error);
      }
    };

    fetchSubscriptionBenefits();
  }, [id, product?.id, product?.pricing_type]);

  // Check if user has active subscription to creator
  useEffect(() => {
    const checkUserSubscription = async () => {
      if (!userProfileId || !product?.creator?.id) {
        setHasActiveSubscription(false);
        setActiveSubscriptionPlanId(null);
        return;
      }

      try {
        // Get creator's subscription plans
        const { data: creatorPlans } = await supabase
          .from('creator_subscription_plans')
          .select('id')
          .eq('creator_id', product.creator.id)
          .eq('is_active', true);

        if (!creatorPlans || creatorPlans.length === 0) {
          setHasActiveSubscription(false);
          return;
        }

        const planIds = creatorPlans.map(p => p.id);

        // Check if user has active subscription to any of these plans
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('plan_id, status, current_period_end')
          .eq('user_id', userProfileId)
          .in('plan_id', planIds)
          .eq('status', 'active')
          .gt('current_period_end', new Date().toISOString())
          .maybeSingle();

        if (subscription) {
          setHasActiveSubscription(true);
          setActiveSubscriptionPlanId(subscription.plan_id);
        } else {
          setHasActiveSubscription(false);
          setActiveSubscriptionPlanId(null);
        }
      } catch (error) {
        console.error('Error checking user subscription:', error);
      }
    };

    checkUserSubscription();
  }, [userProfileId, product?.creator?.id]);

  const fetchProduct = async () => {
    try {
      let query = supabase.from("products").select("*");
      
      // Support both ID and slug lookups
      if (slug) {
        query = query.eq("slug", slug);
      } else if (id) {
        query = query.eq("id", id);
      } else {
        setProduct(null);
        setLoading(false);
        return;
      }
      
      const { data: productData, error: productError } = await query.maybeSingle();

      if (productError) throw productError;
      if (!productData) {
        setProduct(null);
        setLoading(false);
        return;
      }

      let creator = null;
      if (productData.creator_id) {
        // Use public_profiles view for public access (no RLS restrictions for creator info)
        const { data: creatorData } = await supabase
          .from("public_profiles")
          .select("id, username, full_name, avatar_url, bio, verified, user_id")
          .eq("id", productData.creator_id)
          .maybeSingle();
        creator = creatorData;
        
        if (userProfileId && productData.creator_id === userProfileId) {
          setIsOwner(true);
        }
        
        // Check if creator is owner (for Owner badge)
        if (creatorData?.user_id) {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", creatorData.user_id)
            .eq("role", "owner")
            .maybeSingle();
          setIsCreatorAdmin(!!roleData);
        }
      }

      setProduct({ ...productData, creator });
      
      // Fetch related products (same creator or same type)
      fetchRelatedProducts(productData.creator_id, productData.product_type, productData.id);
      fetchFeaturedProducts(productData.id);
      // Download limit is now handled by useDownloadLimitCountdown hook
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async (creatorId: string | null, productType: string | null, excludeId: string) => {
    try {
      let query = supabase
        .from("products")
        .select("id, name, cover_image_url, youtube_url, preview_video_url, price_cents, currency")
        .eq("status", "published")
        .neq("id", excludeId);
      
      // Filter by product_type if it exists
      if (productType) {
        query = query.eq("product_type", productType);
      }
      
      const { data } = await query.limit(5);
      
      setRelatedProducts(data || []);
    } catch (error) {
      console.error("Error fetching related products:", error);
    }
  };

  const fetchFeaturedProducts = async (excludeId: string) => {
    try {
      const { data } = await supabase
        .from("products")
        .select("id, name, cover_image_url, youtube_url, preview_video_url, price_cents, currency")
        .eq("status", "published")
        .eq("featured", true)
        .neq("id", excludeId)
        .limit(10);
      
      setFeaturedProducts(data || []);
    } catch (error) {
      console.error("Error fetching featured products:", error);
    }
  };

  // fetchDownloadLimitInfo is now handled by the useDownloadLimitCountdown hook

  const fetchComments = async () => {
    const productId = id || (product?.id);
    if (!productId) return;
    
    try {
      // Fetch top-level comments (no parent), ordering by pinned first, then by date
      const { data, count } = await supabase
        .from("comments")
        .select("*", { count: "exact" })
        .eq("product_id", productId)
        .is("parent_comment_id", null)
        .order("is_pinned", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(10);
      
      setCommentCount(count || 0);
      
      if (data) {
        // Type for profile data from the public_identities view
        type ProfileIdentity = {
          id: string;
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
          verified: boolean | null;
        };

        // Helper function to fetch profile from safe_public_identities view
        // This view exposes only non-sensitive fields (no user_id mapping) for public access.
        // IMPORTANT: comments/comment_likes store *profile id* (profiles.id), not auth user id.
        const fetchPublicIdentity = async (profileId: string): Promise<ProfileIdentity | null> => {
          const { data } = await supabase
            .from("safe_public_identities")
            .select("id, username, full_name, avatar_url, verified")
            .eq("id", profileId)
            .maybeSingle();
          return data as ProfileIdentity | null;
        };

        // Fetch user info, likes, and replies for each comment
        const commentsWithDetails = await Promise.all(
          data.map(async (comment) => {
            // Get user profile - use public_identities view for public access (includes all users, not just creators)
            const profile = await fetchPublicIdentity(comment.user_id);
            
            // Get likes for this comment
            const { data: likes } = await supabase
              .from("comment_likes")
              .select("id, user_id")
              .eq("comment_id", comment.id);
            
            // Fetch user info for likes (especially to show creator like)
            const likesWithUsers = await Promise.all(
              (likes || []).map(async (like) => {
                const likeUser = await fetchPublicIdentity(like.user_id);
                return { ...like, user: likeUser };
              })
            );
            
            // Get replies
            const { data: replies } = await supabase
              .from("comments")
              .select("*")
              .eq("parent_comment_id", comment.id)
              .order("created_at", { ascending: true });
            
            // Fetch user info and likes for replies
            const repliesWithDetails = await Promise.all(
              (replies || []).map(async (reply) => {
                const replyProfile = await fetchPublicIdentity(reply.user_id);
                
                const { data: replyLikes } = await supabase
                  .from("comment_likes")
                  .select("id, user_id")
                  .eq("comment_id", reply.id);
                
                const replyLikesWithUsers = await Promise.all(
                  (replyLikes || []).map(async (like) => {
                    const likeUser = await fetchPublicIdentity(like.user_id);
                    return { ...like, user: likeUser };
                  })
                );
                
                return {
                  ...reply,
                  user: replyProfile,
                  likes: replyLikesWithUsers,
                  replies: [],
                };
              })
            );
            
            return {
              ...comment,
              is_pinned: comment.is_pinned || false,
              user: profile,
              likes: likesWithUsers,
              replies: repliesWithDetails,
            };
          })
        );
        setComments(commentsWithDetails);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const fetchLikes = async () => {
    const productId = id || (product?.id);
    if (!productId) return;
    
    try {
      const { count } = await supabase
        .from("product_likes")
        .select("*", { count: "exact", head: true })
        .eq("product_id", productId);
      
      setLikeCount(count || 0);

      if (userProfileId) {
        const { data } = await supabase
          .from("product_likes")
          .select("id")
          .eq("product_id", productId)
          .eq("user_id", userProfileId)
          .maybeSingle();
        
        setIsLiked(!!data);
      }
    } catch (error) {
      console.error("Error fetching likes:", error);
    }
  };

  const fetchSavedStatus = async () => {
    const productId = id || (product?.id);
    if (!productId || !userProfileId) {
      setIsSaved(false);
      return;
    }
    
    try {
      const { data } = await supabase
        .from("saved_products")
        .select("id")
        .eq("product_id", productId)
        .eq("user_id", userProfileId)
        .maybeSingle();
      
      setIsSaved(!!data);
    } catch (error) {
      console.error("Error fetching saved status:", error);
    }
  };

  const handleSave = async () => {
    if (!user) {
      const currentPath = window.location.pathname + window.location.search;
      navigate(`/login?next=${encodeURIComponent(currentPath)}`);
      return;
    }
    
    const productId = id || product?.id;
    if (!userProfileId || !productId) return;

    setSavingProduct(true);
    try {
      if (isSaved) {
        await supabase
          .from("saved_products")
          .delete()
          .eq("product_id", productId)
          .eq("user_id", userProfileId);
        
        setIsSaved(false);
        toast.success("Product removed from saved");
      } else {
        await supabase
          .from("saved_products")
          .insert({ product_id: productId, user_id: userProfileId });
        
        setIsSaved(true);
        toast.success("Product saved! View it in your profile.");
      }
    } catch (error) {
      console.error("Error toggling save:", error);
      toast.error("Failed to update saved status");
    } finally {
      setSavingProduct(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      const currentPath = window.location.pathname + window.location.search;
      navigate(`/login?next=${encodeURIComponent(currentPath)}`);
      return;
    }
    
    const productId = id || product?.id;
    if (!userProfileId || !productId) return;

    try {
      if (isLiked) {
        await supabase
          .from("product_likes")
          .delete()
          .eq("product_id", productId)
          .eq("user_id", userProfileId);
        
        setIsLiked(false);
        setLikeCount((prev) => Math.max(0, prev - 1));
      } else {
        await supabase
          .from("product_likes")
          .insert({ product_id: productId, user_id: userProfileId });
        
        setIsLiked(true);
        setLikeCount((prev) => prev + 1);

        // Create notification for the product creator
        if (product?.creator?.id && product.creator.id !== userProfileId) {
          await createNotification({
            userId: product.creator.id,
            type: "product_like",
            actorId: userProfileId,
            productId,
            message: `liked "${product.name}"`,
            redirectUrl: `/product/${productId}`,
          });
        }
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Failed to update like");
    }
  };

  const handleSubmitComment = async () => {
    if (!user) {
      const currentPath = window.location.pathname + window.location.search;
      navigate(`/login?next=${encodeURIComponent(currentPath)}`);
      return;
    }
    
    const productId = id || product?.id;
    if (!userProfileId || !productId || (!newComment.trim() && !selectedGif)) return;

    setSubmittingComment(true);
    try {
      const { data: insertedComment, error } = await supabase
        .from("comments")
        .insert({
          product_id: productId,
          user_id: userProfileId,
          content: newComment.trim(),
          gif_url: selectedGif,
          parent_comment_id: replyingTo,
        })
        .select()
        .single();

      if (error) throw error;

      // Create notification for the product creator (for new comments)
      if (!replyingTo && product?.creator?.id && product.creator.id !== userProfileId) {
        await createNotification({
          userId: product.creator.id,
          type: "comment",
          actorId: userProfileId,
          productId,
          commentId: insertedComment.id,
          message: `commented on "${product.name}"`,
          redirectUrl: `/product/${productId}`,
        });
      }

      // Create notification for reply (to the parent comment author)
      if (replyingTo) {
        const parentComment = comments.find(c => c.id === replyingTo);
        if (parentComment && parentComment.user_id !== userProfileId) {
          await createNotification({
            userId: parentComment.user_id,
            type: "comment_reply",
            actorId: userProfileId,
            productId,
            commentId: insertedComment.id,
            message: `replied to your comment on "${product?.name}"`,
            redirectUrl: `/product/${productId}`,
          });
        }
      }

      setNewComment("");
      setSelectedGif(null);
      setReplyingTo(null);
      fetchComments();
      toast.success(replyingTo ? "Reply posted!" : "Comment posted!");
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Failed to post comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCommentLike = async (commentId: string) => {
    if (!user) {
      const currentPath = window.location.pathname + window.location.search;
      navigate(`/login?next=${encodeURIComponent(currentPath)}`);
      return;
    }
    
    if (!userProfileId) return;

    setLikingComment(commentId);
    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from("comment_likes")
        .select("id")
        .eq("comment_id", commentId)
        .eq("user_id", userProfileId)
        .maybeSingle();

      if (existingLike) {
        // Unlike
        await supabase
          .from("comment_likes")
          .delete()
          .eq("id", existingLike.id);
      } else {
        // Like
        await supabase
          .from("comment_likes")
          .insert({
            comment_id: commentId,
            user_id: userProfileId,
          });

        // Find the comment owner to send notification
        const likedComment = comments.find(c => c.id === commentId) || 
          comments.flatMap(c => c.replies || []).find(r => r.id === commentId);
        
        if (likedComment && likedComment.user_id !== userProfileId) {
          await createNotification({
            userId: likedComment.user_id,
            type: "comment_like",
            actorId: userProfileId,
            productId: id || product?.id,
            commentId,
            message: `liked your comment on "${product?.name}"`,
            redirectUrl: `/product/${id || product?.id}`,
          });
        }
      }

      fetchComments();
    } catch (error) {
      console.error("Error toggling comment like:", error);
      toast.error("Failed to update like");
    } finally {
      setLikingComment(null);
    }
  };

  // Ref for the comment input to scroll to
  const commentInputRef = useRef<HTMLDivElement>(null);

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId);
    // Find the comment to show who we're replying to
    const comment = comments.find(c => c.id === commentId);
    if (comment?.user?.username) {
      setNewComment(`@${comment.user.username} `);
    }
    // Scroll to comment input
    setTimeout(() => {
      commentInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      fetchComments();
      toast.success("Comment deleted");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    }
  };

  // Check if user can delete a comment (own comment or is creator)
  const canDeleteComment = (comment: Comment) => {
    if (!userProfileId) return false;
    // User can delete their own comment
    if (comment.user_id === userProfileId) return true;
    // Creator can delete any comment on their product
    if (product?.creator?.id === userProfileId) return true;
    return false;
  };

  // Check if user can pin/unpin comments (only product creator/seller)
  const canPinComment = () => {
    if (!userProfileId) return false;
    return product?.creator?.id === userProfileId;
  };

  // Toggle pin status on a comment
  const handlePinComment = async (commentId: string, currentlyPinned: boolean) => {
    try {
      const { error } = await supabase
        .from("comments")
        .update({ is_pinned: !currentlyPinned })
        .eq("id", commentId);

      if (error) throw error;

      fetchComments();
      toast.success(currentlyPinned ? "Comment unpinned" : "Comment pinned!");
    } catch (error) {
      console.error("Error toggling pin:", error);
      toast.error("Failed to update pin status");
    }
  };

  const formatPrice = (cents: number | null, type: string | null, currency: string | null) => {
    if (type === "free" || !cents) return "Free";
    const amount = cents / 100;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "Unknown size";
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    const kb = bytes / 1024;
    return `${kb.toFixed(2)} KB`;
  };

  const handleShare = async () => {
    // Build the correct shareable URL using custom domain + slug or id
    const PRODUCTION_DOMAIN = "https://sellspay.com";
    const productPath = product?.slug 
      ? `/p/${product.slug}` 
      : `/product/${product?.id}`;
    const shareUrl = `${PRODUCTION_DOMAIN}${productPath}`;
    
    try {
      await navigator.share({
        title: product?.name,
        text: product?.description || "",
        url: shareUrl,
      });
    } catch {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    }
  };

  // Handle following the creator
  const handleFollowCreator = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    
    if (!userProfileId || !product?.creator?.id) return;

    // Check for cooldown
    const cooldownCheck = await checkFollowCooldown(userProfileId, product.creator.id);
    if (cooldownCheck.blocked) {
      toast.error(`You can't follow this user for ${cooldownCheck.daysLeft} more day(s) due to a previous unfollow.`);
      return;
    }

    setFollowingCreator(true);
    try {
      const { error } = await supabase
        .from("followers")
        .insert({
          follower_id: userProfileId,
          following_id: product.creator.id,
        });

      if (error) throw error;

      setIsFollowingCreator(true);
      setShowFollowDialog(false);
      toast.success(`You're now following @${product.creator.username}!`);

      // Create notification for the creator
      // Fetch actor username for proper redirect (use public view to bypass RLS)
      const { data: actorProfile } = await supabase.from("safe_public_identities").select("username").eq("id", userProfileId).maybeSingle();
      const actorUsername = actorProfile?.username;
      
      await createNotification({
        userId: product.creator.id,
        type: "follow",
        actorId: userProfileId,
        message: "started following you",
        redirectUrl: actorUsername ? `/@${actorUsername}` : null,
      });
    } catch (error) {
      console.error("Error following creator:", error);
      toast.error("Failed to follow creator");
    } finally {
      setFollowingCreator(false);
    }
  };

  // Handle access button click
  const handleAccessClick = () => {
    if (!user) {
      // Redirect to login with current URL as next param so user returns here after auth
      const currentPath = window.location.pathname + window.location.search;
      navigate(`/login?next=${encodeURIComponent(currentPath)}`);
      return;
    }
    
    if (!isFollowingCreator && !isOwner) {
      setShowFollowDialog(true);
      return;
    }
    
    // User follows creator or is owner - proceed with download/purchase
    if (product?.pricing_type === "free") {
      // Handle free download using signed URL
      handleDownload();
    } else {
      handlePurchase();
    }
  };

  // Helper to download a single file with progress
  const downloadSingleFile = async (
    productId: string, 
    attachmentPath?: string, 
    fallbackFilename?: string
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke("get-download-url", {
        body: { productId, attachmentPath },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.url) {
        const filename = data.filename || fallbackFilename || 'download';
        
        try {
          const blob = await downloadWithProgress(data.url, filename);
          
          if (blob) {
            const blobUrl = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
            return true;
          }
        } catch (fetchError) {
          console.warn("Blob download failed, falling back to window.open:", fetchError);
          window.open(data.url, '_blank');
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Download error:", error);
      throw error;
    }
  };

  const handleDownload = async () => {
    if (!product) return;
    
    // Get all attachments
    const attachments = product.attachments as { name: string; path: string; size: number }[] | null;
    const hasAttachments = attachments && Array.isArray(attachments) && attachments.length > 0;
    
    // Check if product has any download files
    if (!product.download_url && !hasAttachments) {
      toast.error("This product doesn't have a download file attached yet.");
      return;
    }
    
    // Ensure user is authenticated
    if (!user) {
      toast.error("Please log in to download this product.");
      navigate("/login");
      return;
    }
    
    setDownloading(true);
    try {
      // Get fresh session to ensure auth token is valid
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast.error("Your session has expired. Please log in again.");
        navigate("/login");
        return;
      }
      
      // Determine what to download
      if (hasAttachments && attachments.length > 0) {
        // Multiple attachments - download all of them
        const totalFiles = attachments.length;
        let successCount = 0;
        
        setDownloadTotalFiles(totalFiles);
        toast.info(`Downloading ${totalFiles} file${totalFiles > 1 ? 's' : ''}...`);
        
        for (let i = 0; i < attachments.length; i++) {
          const attachment = attachments[i];
          setDownloadFileIndex(i + 1);
          
          try {
            const success = await downloadSingleFile(product.id, attachment.path, attachment.name);
            if (success) {
              successCount++;
            }
            
            // Small delay between downloads to prevent overwhelming the browser
            if (i < attachments.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          } catch (error) {
            console.error(`Failed to download ${attachment.name}:`, error);
            const message = error instanceof Error ? error.message : "Download failed";
            toast.error(`Failed to download ${attachment.name}: ${message}`);
            // Continue with other files even if one fails
          }
        }
        
        // Reset multi-file tracking
        setDownloadFileIndex(0);
        setDownloadTotalFiles(0);
        
        if (successCount === totalFiles) {
          toast.success(`Successfully downloaded all ${totalFiles} files!`);
        } else if (successCount > 0) {
          toast.warning(`Downloaded ${successCount} of ${totalFiles} files`);
        }
        
        // Refresh download limit info
        refetchDownloadLimit();
      } else if (product.download_url) {
        // Single file (legacy download_url only)
        try {
          const success = await downloadSingleFile(product.id);
          if (success) {
            toast.success("Download complete!");
            refetchDownloadLimit();
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to get download link";
          toast.error(message);
        }
      }
    } catch (error) {
      console.error("Download error:", error);
      const message = error instanceof Error ? error.message : "Failed to get download link";
      toast.error(message);
    } finally {
      setDownloading(false);
    }
  };

  const handlePurchase = () => {
    if (!user) {
      toast.error("Please sign in to purchase");
      return;
    }

    if (!product) return;

    // Open payment method dialog
    setShowPaymentDialog(true);
  };

  const getYouTubeEmbedUrl = (url: string | null) => {
    if (!url) return null;
    if (url.length === 11 && !url.includes('/')) {
      return `https://www.youtube.com/embed/${url}`;
    }
    const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  const getVideoUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const { data } = supabase.storage.from('product-media').getPublicUrl(path);
    return data?.publicUrl || null;
  };

  const handleDelete = async () => {
    if (!id) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Product deleted");
      navigate("/products");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    } finally {
      setDeleting(false);
    }
  };

  // Check if description needs truncation (more than 5 lines)
  const descriptionLineCount = (product?.description?.split('\n').length || 0);
  const shouldTruncateDescription = descriptionLineCount > 5 || (product?.description?.length || 0) > 300;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 w-32 bg-muted rounded" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="aspect-video bg-muted rounded-xl" />
              <div className="h-10 bg-muted rounded w-3/4" />
              <div className="h-24 bg-muted rounded" />
            </div>
            <div className="space-y-4">
              <div className="h-40 bg-muted rounded" />
              <div className="h-60 bg-muted rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The product you're looking for doesn't exist or has been removed.
        </p>
        <Button asChild>
          <Link to="/products">Browse Products</Link>
        </Button>
      </div>
    );
  }

  const embedUrl = getYouTubeEmbedUrl(product.youtube_url);
  const displayedComments = showAllComments ? comments : comments.slice(0, 4);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Back Button & Owner Actions */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" asChild>
          <Link to="/products">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </Button>
        
        {isOwner && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/edit-product/${id}`}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={deleting}>
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Product</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this product? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content - Left Side */}
        <div className="lg:col-span-2 space-y-6">
          {/* Media */}
          <div className="rounded-xl overflow-hidden bg-card border border-border">
            {embedUrl ? (
              <div className="aspect-video">
                <iframe
                  src={embedUrl}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
            ) : product.preview_video_url ? (
              <video
                src={getVideoUrl(product.preview_video_url)}
                className="w-full aspect-video object-cover"
                controls
                poster={product.cover_image_url || undefined}
              />
            ) : product.cover_image_url ? (
              <img
                src={product.cover_image_url}
                alt={product.name}
                className="w-full aspect-video object-cover"
              />
            ) : (
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <Play className="w-16 h-16 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Title & Meta with Download Button */}
          <div>
            <div className="flex items-start justify-between gap-4 mb-3">
              <h1 className="text-2xl font-bold">{product.name}</h1>
              
              {/* Primary Action Button - Right next to title */}
              {!isOwner && (
                <div className="flex-shrink-0">
                  {/* User has purchased */}
                  {hasPurchased ? (
                    <Button 
                      className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600"
                      onClick={handleDownload}
                      disabled={downloading || downloadLimitInfo?.isLocked}
                    >
                      {downloading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      {downloadLimitInfo?.isLocked 
                        ? `Limit (${getCountdownString()})` 
                        : downloadLimitInfo 
                          ? `Download (${downloadLimitInfo.remaining}/2)`
                          : 'Download'
                      }
                    </Button>
                  ) : hasActiveSubscription ? (
                    // User has active subscription to this creator
                    <Button 
                      className="bg-gradient-to-r from-primary to-accent"
                      onClick={handleDownload}
                      disabled={downloading || downloadLimitInfo?.isLocked}
                    >
                      {downloading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Crown className="w-4 h-4 mr-2" />
                      )}
                      {downloadLimitInfo?.isLocked 
                        ? `Limit (${getCountdownString()})` 
                        : 'Download (Subscriber)'
                      }
                    </Button>
                  ) : isSubscriptionOnly ? (
                    // Subscription-only product - cannot buy, must subscribe
                    <Button 
                      variant="outline"
                      className="border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
                      disabled
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Subscribers Only
                    </Button>
                  ) : isFollowingCreator || !product.creator ? (
                    product.pricing_type === "free" ? (
                      <Button 
                        className="bg-gradient-to-r from-primary to-accent"
                        onClick={handleDownload}
                        disabled={downloading || downloadLimitInfo?.isLocked}
                      >
                        {downloading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4 mr-2" />
                        )}
                        {downloadLimitInfo?.isLocked 
                          ? `Limit (${getCountdownString()})` 
                          : downloadLimitInfo 
                            ? `Free (${downloadLimitInfo.remaining}/2)`
                            : 'Download Free'
                        }
                      </Button>
                    ) : (
                      <Button 
                        className="bg-gradient-to-r from-primary to-accent"
                        onClick={handleAccessClick}
                        disabled={purchasing}
                      >
                        {purchasing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>Buy {formatPrice(product.price_cents, product.pricing_type, product.currency)}</>
                        )}
                      </Button>
                    )
                  ) : (
                    <Button 
                      className="bg-gradient-to-r from-primary to-accent"
                      onClick={handleAccessClick}
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Get Access
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4 mb-4">
              {/* Creator Mini - Shows @username with verified badge */}
              {product.creator && (
                <Link to={`/@${product.creator.username}`} className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={product.creator.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {product.creator.username?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
                    @{product.creator.username || "unknown"}
                    {product.creator.verified && (
                      <VerifiedBadge size="sm" isOwner={isCreatorAdmin} />
                    )}
                  </span>
                </Link>
              )}
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(product.created_at)}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLike}
                className="gap-2"
              >
                <Heart className={`w-4 h-4 ${isLiked ? "fill-destructive text-destructive" : ""}`} />
                {likeCount}
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <MessageCircle className="w-4 h-4" />
                {commentCount}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSave}
                disabled={savingProduct}
                className="gap-2"
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? "fill-primary text-primary" : ""}`} />
                {isSaved ? "Saved" : "Save"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Subscription Promotion Banner */}
          {!isOwner && !hasPurchased && !hasActiveSubscription && planBenefits.length > 0 && product.creator && (
            <SubscriptionPromotion
              creatorId={product.creator.id}
              creatorName={product.creator.username || 'creator'}
              productName={product.name}
              productPriceCents={product.price_cents}
              productCurrency={product.currency}
              planBenefits={planBenefits}
              isSubscriptionOnly={isSubscriptionOnly}
              hasActiveSubscription={hasActiveSubscription}
              activeSubscriptionPlanId={activeSubscriptionPlanId}
            />
          )}

          {/* Comments Section - Moved right under action buttons */}
          <div>
            <h3 className="font-semibold mb-4">Comments</h3>
            
            {/* Comments List - Now ABOVE the input */}
            <div className="max-h-[320px] overflow-y-auto scroll-smooth space-y-4 mb-4 pr-1">
              {displayedComments.map((comment) => (
                <div key={comment.id} className="space-y-2">
                  <div className="flex gap-3">
                    <Link to={comment.user?.username ? `/@${comment.user.username}` : '#'}>
                      <Avatar className="w-8 h-8 flex-shrink-0 hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer">
                        <AvatarImage src={comment.user?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {comment.user?.username?.[0]?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {comment.is_pinned && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-0">
                            <Pin className="w-2.5 h-2.5 mr-0.5" />
                            Pinned
                          </Badge>
                        )}
                        <Link 
                          to={comment.user?.username ? `/@${comment.user.username}` : '#'}
                          className="text-sm font-medium flex items-center gap-1 hover:text-primary transition-colors"
                        >
                          @{comment.user?.username || "anonymous"}
                          {comment.user?.verified && (
                            <VerifiedBadge size="sm" />
                          )}
                        </Link>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      
                      {/* Comment content */}
                      {comment.content && (
                        <p className="text-sm text-muted-foreground mt-1">{comment.content}</p>
                      )}
                      
                      {/* GIF content */}
                      {comment.gif_url && (
                        <div className="mt-2 rounded-lg overflow-hidden max-w-xs">
                          <img
                            src={comment.gif_url}
                            alt="GIF"
                            className="max-w-full h-auto"
                            loading="lazy"
                          />
                        </div>
                      )}
                      
                      {/* Actions row */}
                      <div className="flex items-center gap-3 mt-2">
                        {/* Like button with count */}
                        <button
                          onClick={() => handleCommentLike(comment.id)}
                          disabled={likingComment === comment.id}
                          className={cn(
                            "flex items-center gap-1 text-xs transition-colors",
                            comment.likes.some(l => l.user_id === userProfileId)
                              ? "text-destructive"
                              : "text-muted-foreground hover:text-destructive"
                          )}
                        >
                          {likingComment === comment.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Heart
                              className={cn(
                                "w-3.5 h-3.5",
                                comment.likes.some(l => l.user_id === userProfileId) && "fill-current"
                              )}
                            />
                          )}
                          {comment.likes.length > 0 && (
                            <span>{comment.likes.length}</span>
                          )}
                        </button>

                        {/* Creator liked indicator */}
                        {product?.creator && comment.likes.some(l => l.user_id === product.creator?.id) && (
                          <div className="flex items-center gap-1">
                            <Heart className="w-3 h-3 text-destructive fill-destructive" />
                            <Avatar className="w-4 h-4 border border-destructive">
                              <AvatarImage src={product.creator.avatar_url || undefined} />
                              <AvatarFallback className="text-[8px]">
                                {product.creator.username?.[0]?.toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        )}

                        {/* Reply button */}
                        <button
                          onClick={() => handleReply(comment.id)}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Reply className="w-3.5 h-3.5" />
                          Reply
                        </button>

                        {/* Pin button - only for product creator/seller */}
                        {canPinComment() && (
                          <button
                            onClick={() => handlePinComment(comment.id, comment.is_pinned)}
                            className={cn(
                              "flex items-center gap-1 text-xs transition-colors",
                              comment.is_pinned
                                ? "text-primary"
                                : "text-muted-foreground hover:text-primary"
                            )}
                          >
                            <Pin className={cn("w-3.5 h-3.5", comment.is_pinned && "fill-current")} />
                            {comment.is_pinned ? "Unpin" : "Pin"}
                          </button>
                        )}

                        {/* Delete button */}
                        {canDeleteComment(comment) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Comment</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this comment? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                      
                      {/* Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <Collapsible className="mt-2">
                          <CollapsibleTrigger className="flex items-center gap-1 text-xs text-primary hover:underline">
                            <ChevronDown className="w-3 h-3" />
                            View {comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2 space-y-3 ml-6 border-l-2 border-border pl-3">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="flex gap-2">
                                <Link to={reply.user?.username ? `/@${reply.user.username}` : '#'}>
                                  <Avatar className="w-6 h-6 flex-shrink-0 hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer">
                                    <AvatarImage src={reply.user?.avatar_url || undefined} />
                                    <AvatarFallback className="text-[10px]">
                                      {reply.user?.username?.[0]?.toUpperCase() || "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                </Link>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Link 
                                      to={reply.user?.username ? `/@${reply.user.username}` : '#'}
                                      className="text-xs font-medium flex items-center gap-1 hover:text-primary transition-colors"
                                    >
                                      @{reply.user?.username || "anonymous"}
                                      {reply.user?.verified && (
                                        <VerifiedBadge size="sm" />
                                      )}
                                    </Link>
                                    <span className="text-[10px] text-muted-foreground">
                                      {formatDate(reply.created_at)}
                                    </span>
                                  </div>
                                  {reply.content && (
                                    <p className="text-xs text-muted-foreground mt-0.5">{reply.content}</p>
                                  )}
                                  {reply.gif_url && (
                                    <div className="mt-1 rounded overflow-hidden max-w-[150px]">
                                      <img src={reply.gif_url} alt="GIF" className="max-w-full h-auto" loading="lazy" />
                                    </div>
                                  )}
                                  {/* Reply like button */}
                                  <div className="flex items-center gap-2 mt-1">
                                    <button
                                      onClick={() => handleCommentLike(reply.id)}
                                      disabled={likingComment === reply.id}
                                      className={cn(
                                        "flex items-center gap-1 text-[10px] transition-colors",
                                        reply.likes.some(l => l.user_id === userProfileId)
                                          ? "text-destructive"
                                          : "text-muted-foreground hover:text-destructive"
                                      )}
                                    >
                                      {likingComment === reply.id ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <Heart
                                          className={cn(
                                            "w-3 h-3",
                                            reply.likes.some(l => l.user_id === userProfileId) && "fill-current"
                                          )}
                                        />
                                      )}
                                      {reply.likes.length > 0 && <span>{reply.likes.length}</span>}
                                    </button>
                                    {product?.creator && reply.likes.some(l => l.user_id === product.creator?.id) && (
                                      <div className="flex items-center gap-0.5">
                                        <Heart className="w-2.5 h-2.5 text-destructive fill-destructive" />
                                        <Avatar className="w-3 h-3 border border-destructive">
                                          <AvatarImage src={product.creator.avatar_url || undefined} />
                                          <AvatarFallback className="text-[6px]">
                                            {product.creator.username?.[0]?.toUpperCase() || "?"}
                                          </AvatarFallback>
                                        </Avatar>
                                      </div>
                                    )}
                                    
                                    {/* Delete reply button */}
                                    {canDeleteComment(reply) && (
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <button
                                            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-destructive transition-colors"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Reply</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Are you sure you want to delete this reply? This action cannot be undone.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() => handleDeleteComment(reply.id)}
                                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                              Delete
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {comments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No comments yet. Be the first to comment!
                </p>
              )}
              
              {comments.length > 4 && !showAllComments && (
                <Button 
                  variant="ghost" 
                  className="w-full text-primary hover:text-primary"
                  onClick={() => setShowAllComments(true)}
                >
                  Show more ({comments.length - 4} more)
                </Button>
              )}
            </div>
            
            {/* Replying indicator */}
            {replyingTo && (
              <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                <Reply className="w-3 h-3" />
                <span>Replying to comment</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-auto p-1 text-xs"
                  onClick={() => {
                    setReplyingTo(null);
                    setNewComment("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
            
            {/* New Comment Input - Now BELOW the comments list */}
            {user && (
              <div ref={commentInputRef} className="space-y-2">
                {/* Selected GIF preview */}
                {selectedGif && (
                  <div className="relative inline-block">
                    <img 
                      src={selectedGif} 
                      alt="Selected GIF" 
                      className="max-h-24 rounded-md"
                    />
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full"
                      onClick={() => setSelectedGif(null)}
                    >
                      <span className="sr-only">Remove GIF</span>
                      ×
                    </Button>
                  </div>
                )}
                
                <div className="flex gap-2 items-end">
                  <div className="flex-1 relative">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
                      className="min-h-[60px] pr-16"
                    />
                    <div className="absolute right-2 bottom-2">
                      <GifPicker onSelect={setSelectedGif} />
                    </div>
                  </div>
                  <Button 
                    onClick={handleSubmitComment} 
                    disabled={submittingComment || (!newComment.trim() && !selectedGif)}
                    size="icon"
                    className="h-[60px] w-[60px] rounded-full shrink-0"
                  >
                    {submittingComment ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>
            )}
            
            {/* Login prompt for unauthenticated users */}
            {!user && (
              <div className="text-center py-2">
                <Link to="/login" className="text-sm text-primary hover:underline">
                  Log in to comment
                </Link>
              </div>
            )}
          </div>

          <Separator />


          {/* Description - Collapsible */}
          {product.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <div 
                className={cn(
                  "text-muted-foreground whitespace-pre-wrap leading-relaxed overflow-hidden",
                  !descriptionExpanded && shouldTruncateDescription && "line-clamp-5"
                )}
              >
                {product.description}
              </div>
              {shouldTruncateDescription && (
                <button
                  className="text-primary hover:underline text-sm mt-1"
                  onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                >
                  {descriptionExpanded ? "Show less" : "Show more"}
                </button>
              )}
            </div>
          )}

          {/* Attachments Section - Main Content */}
          <AttachmentsSection 
            product={product} 
            isOwner={isOwner} 
            hasPurchased={hasPurchased}
            isFollowingCreator={isFollowingCreator}
          />

          <Separator className="mt-6" />
        </div>

        {/* Sidebar - Right Side */}
        <div className="space-y-6">
          {/* Creator Card */}
          {product.creator && (
            <Card className="bg-card">
              <CardContent className="p-6 text-center">
                <Avatar className="w-16 h-16 mx-auto mb-3">
                  <AvatarImage src={product.creator.avatar_url || undefined} />
                  <AvatarFallback>
                    {product.creator.username?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold flex items-center justify-center gap-1">
                  @{product.creator.username || "unknown"}
                  {product.creator.verified && (
                    <VerifiedBadge size="sm" isOwner={isCreatorAdmin} />
                  )}
                </h3>
                {product.creator.bio && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {product.creator.bio}
                  </p>
                )}
                
                {/* Subscription Badge - Compact, premium design */}
                {!isOwner && !hasPurchased && !hasActiveSubscription && planBenefits.length > 0 && (
                  <div className="mt-4 flex justify-center">
                    <SubscriptionBadge
                      creatorId={product.creator.id}
                      creatorName={product.creator.username || 'creator'}
                      planBenefits={planBenefits}
                      isSubscriptionOnly={isSubscriptionOnly}
                      activeSubscriptionPlanId={activeSubscriptionPlanId}
                    />
                  </div>
                )}
                
                <Button asChild className="w-full mt-4" variant="outline">
                  <Link to={`/@${product.creator.username}`}>
                    View Profile
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <Card className="bg-card">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">Related Products</h3>
                <div className="space-y-3">
                  {relatedProducts.slice(0, 5).map((prod) => {
                    const thumbnail = prod.cover_image_url || getYouTubeThumbnail(prod.youtube_url);
                    return (
                      <Link 
                        key={prod.id} 
                        to={`/product/${prod.id}`}
                        className="flex items-center gap-3 hover:bg-secondary/30 rounded-lg p-2 -mx-2 transition-colors"
                      >
                        {thumbnail ? (
                          <img 
                            src={thumbnail} 
                            alt={prod.name} 
                            className="w-12 h-12 rounded object-cover flex-shrink-0"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (target.src.includes('hqdefault')) {
                                target.src = target.src.replace('hqdefault', 'default');
                              }
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                            <Play className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{prod.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatPrice(prod.price_cents, null, prod.currency)}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Featured Products */}
          {featuredProducts.length > 0 && (
            <Card className="bg-card border-primary/20">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  Featured Products
                </h3>
                <div className="space-y-3">
                  {featuredProducts.map((prod) => {
                    const thumbnail = prod.cover_image_url || getYouTubeThumbnail(prod.youtube_url);
                    return (
                      <Link 
                        key={prod.id} 
                        to={`/product/${prod.id}`}
                        className="flex items-center gap-3 hover:bg-secondary/30 rounded-lg p-2 -mx-2 transition-colors"
                      >
                        {thumbnail ? (
                          <img 
                            src={thumbnail} 
                            alt={prod.name} 
                            className="w-12 h-12 rounded object-cover flex-shrink-0"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (target.src.includes('hqdefault')) {
                                target.src = target.src.replace('hqdefault', 'default');
                              }
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                            <Play className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{prod.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatPrice(prod.price_cents, null, prod.currency)}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
                <Button 
                  variant="ghost" 
                  className="w-full mt-4 text-primary hover:text-primary/80"
                  onClick={() => navigate('/products?featured=true')}
                >
                  View More Featured
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Follow Creator Dialog - Enhanced */}
      <CreatorFollowDialog
        open={showFollowDialog}
        onOpenChange={setShowFollowDialog}
        creator={product?.creator || null}
        onFollow={handleFollowCreator}
        isFollowing={isFollowingCreator}
      />

      {/* Payment Method Dialog */}
      {product && (
        <PaymentMethodDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          productId={product.id}
          productName={product.name}
          priceCents={product.price_cents || 0}
          currency={product.currency || "USD"}
        />
      )}

      {/* Download Progress Overlay */}
      {isDownloadingWithProgress && (
        <DownloadProgressOverlay
          progress={downloadProgress}
          onCancel={cancelDownload}
          onClose={clearDownloadProgress}
          currentFile={downloadFileIndex}
          totalFiles={downloadTotalFiles}
        />
      )}
    </div>
  );
}
