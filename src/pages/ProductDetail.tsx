import { useState, useEffect } from "react";
import { useParams, Link, useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Download, Share2, Heart, MessageCircle, Calendar, Loader2, BadgeCheck, Pencil, Trash2, FileIcon, Send, Lock, ChevronDown, ChevronUp, UserPlus, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { GifPicker } from "@/components/comments/GifPicker";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  preview_video_url: string | null;
  youtube_url: string | null;
  price_cents: number | null;
  pricing_type: string | null;
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

interface RelatedCreator {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  verified: boolean | null;
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

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
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
  const [relatedCreators, setRelatedCreators] = useState<RelatedCreator[]>([]);

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

  // Check for purchase success from URL
  useEffect(() => {
    const purchaseStatus = searchParams.get("purchase");
    if (purchaseStatus === "success") {
      toast.success("Purchase successful! Thank you for your order.");
      setHasPurchased(true);
      window.history.replaceState({}, "", `/product/${id}`);
    } else if (purchaseStatus === "canceled") {
      toast.info("Purchase was canceled");
      window.history.replaceState({}, "", `/product/${id}`);
    }
  }, [searchParams, id]);

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchLikes();
      fetchComments();
    }
  }, [id, userProfileId]);

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

  const fetchProduct = async () => {
    try {
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (productError) throw productError;
      if (!productData) {
        setProduct(null);
        setLoading(false);
        return;
      }

      let creator = null;
      if (productData.creator_id) {
        const { data: creatorData } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url, bio, verified")
          .eq("id", productData.creator_id)
          .maybeSingle();
        creator = creatorData;
        
        if (userProfileId && productData.creator_id === userProfileId) {
          setIsOwner(true);
        }
      }

      setProduct({ ...productData, creator });
      
      // Fetch related products (same creator or same type)
      fetchRelatedProducts(productData.creator_id, productData.product_type, productData.id);
      fetchRelatedCreators(productData.creator_id);
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async (creatorId: string | null, productType: string | null, excludeId: string) => {
    try {
      const { data } = await supabase
        .from("products")
        .select("id, name, cover_image_url, youtube_url, preview_video_url, price_cents, currency")
        .eq("status", "published")
        .neq("id", excludeId)
        .limit(5);
      
      setRelatedProducts(data || []);
    } catch (error) {
      console.error("Error fetching related products:", error);
    }
  };

  const fetchRelatedCreators = async (excludeId: string | null) => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, verified")
        .eq("is_creator", true)
        .limit(5);
      
      setRelatedCreators((data || []).filter(c => c.id !== excludeId));
    } catch (error) {
      console.error("Error fetching related creators:", error);
    }
  };

  const fetchComments = async () => {
    if (!id) return;
    
    try {
      // Fetch top-level comments (no parent)
      const { data, count } = await supabase
        .from("comments")
        .select("*", { count: "exact" })
        .eq("product_id", id)
        .is("parent_comment_id", null)
        .order("created_at", { ascending: false })
        .limit(10);
      
      setCommentCount(count || 0);
      
      if (data) {
        // Fetch user info, likes, and replies for each comment
        const commentsWithDetails = await Promise.all(
          data.map(async (comment) => {
            // Get user profile
            const { data: profile } = await supabase
              .from("profiles")
              .select("id, username, full_name, avatar_url, verified")
              .eq("id", comment.user_id)
              .maybeSingle();
            
            // Get likes for this comment
            const { data: likes } = await supabase
              .from("comment_likes")
              .select("id, user_id")
              .eq("comment_id", comment.id);
            
            // Fetch user info for likes (especially to show creator like)
            const likesWithUsers = await Promise.all(
              (likes || []).map(async (like) => {
                const { data: likeUser } = await supabase
                  .from("profiles")
                  .select("id, username, full_name, avatar_url, verified")
                  .eq("id", like.user_id)
                  .maybeSingle();
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
                const { data: replyProfile } = await supabase
                  .from("profiles")
                  .select("id, username, full_name, avatar_url, verified")
                  .eq("id", reply.user_id)
                  .maybeSingle();
                
                const { data: replyLikes } = await supabase
                  .from("comment_likes")
                  .select("id, user_id")
                  .eq("comment_id", reply.id);
                
                const replyLikesWithUsers = await Promise.all(
                  (replyLikes || []).map(async (like) => {
                    const { data: likeUser } = await supabase
                      .from("profiles")
                      .select("id, username, full_name, avatar_url, verified")
                      .eq("id", like.user_id)
                      .maybeSingle();
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
    if (!id) return;
    
    try {
      const { count } = await supabase
        .from("product_likes")
        .select("*", { count: "exact", head: true })
        .eq("product_id", id);
      
      setLikeCount(count || 0);

      if (userProfileId) {
        const { data } = await supabase
          .from("product_likes")
          .select("id")
          .eq("product_id", id)
          .eq("user_id", userProfileId)
          .maybeSingle();
        
        setIsLiked(!!data);
      }
    } catch (error) {
      console.error("Error fetching likes:", error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast.error("Please sign in to like products");
      return;
    }
    
    if (!userProfileId || !id) return;

    try {
      if (isLiked) {
        await supabase
          .from("product_likes")
          .delete()
          .eq("product_id", id)
          .eq("user_id", userProfileId);
        
        setIsLiked(false);
        setLikeCount((prev) => Math.max(0, prev - 1));
      } else {
        await supabase
          .from("product_likes")
          .insert({ product_id: id, user_id: userProfileId });
        
        setIsLiked(true);
        setLikeCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Failed to update like");
    }
  };

  const handleSubmitComment = async () => {
    if (!user) {
      toast.error("Please sign in to comment");
      return;
    }
    
    if (!userProfileId || !id || (!newComment.trim() && !selectedGif)) return;

    setSubmittingComment(true);
    try {
      const { error } = await supabase
        .from("comments")
        .insert({
          product_id: id,
          user_id: userProfileId,
          content: newComment.trim(),
          gif_url: selectedGif,
          parent_comment_id: replyingTo,
        });

      if (error) throw error;

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
      toast.error("Please sign in to like comments");
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
      }

      fetchComments();
    } catch (error) {
      console.error("Error toggling comment like:", error);
      toast.error("Failed to update like");
    } finally {
      setLikingComment(null);
    }
  };

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId);
    // Find the comment to show who we're replying to
    const comment = comments.find(c => c.id === commentId);
    if (comment?.user?.username) {
      setNewComment(`@${comment.user.username} `);
    }
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
    try {
      await navigator.share({
        title: product?.name,
        text: product?.description || "",
        url: window.location.href,
      });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
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
      navigate("/login");
      return;
    }
    
    if (!isFollowingCreator && !isOwner) {
      setShowFollowDialog(true);
      return;
    }
    
    // User follows creator or is owner - proceed with download/purchase
    if (product?.pricing_type === "free") {
      // Handle free download
      toast.success("Download starting...");
    } else {
      handlePurchase();
    }
  };

  const handlePurchase = async () => {
    if (!user) {
      toast.error("Please sign in to purchase");
      return;
    }

    if (!product) return;

    setPurchasing(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { product_id: product.id },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Purchase error:", error);
      const message = error instanceof Error ? error.message : "Failed to start checkout";
      toast.error(message);
    } finally {
      setPurchasing(false);
    }
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
    return `https://ocwvpzvbnepqmqkkrqcv.supabase.co/storage/v1/object/public/product-media/${path}`;
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
                  {hasPurchased ? (
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  ) : isFollowingCreator || !product.creator ? (
                    product.pricing_type === "free" ? (
                      <Button 
                        className="bg-gradient-to-r from-primary to-accent"
                        onClick={handleAccessClick}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Free
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
                      <BadgeCheck className="w-4 h-4 text-primary" />
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
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Comments Section - Moved right under action buttons */}
          <div>
            <h3 className="font-semibold mb-4">Comments</h3>
            
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
            
            {/* New Comment Input */}
            {user && (
              <div className="space-y-2 mb-4">
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

            {/* Comments List */}
            <div className="space-y-4">
              {displayedComments.map((comment) => (
                <div key={comment.id} className="space-y-2">
                  <div className="flex gap-3">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={comment.user?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {comment.user?.username?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium flex items-center gap-1">
                          @{comment.user?.username || "anonymous"}
                          {comment.user?.verified && (
                            <BadgeCheck className="w-3 h-3 text-primary" />
                          )}
                        </span>
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
                                <Avatar className="w-6 h-6 flex-shrink-0">
                                  <AvatarImage src={reply.user?.avatar_url || undefined} />
                                  <AvatarFallback className="text-[10px]">
                                    {reply.user?.username?.[0]?.toUpperCase() || "?"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-medium flex items-center gap-1">
                                      @{reply.user?.username || "anonymous"}
                                      {reply.user?.verified && (
                                        <BadgeCheck className="w-2.5 h-2.5 text-primary" />
                                      )}
                                    </span>
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
          </div>

          <Separator />

          {/* Attachments Section - Purple style with lock icon */}
          {product.attachments && Array.isArray(product.attachments) && product.attachments.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Attachments</h3>
              <div className="space-y-2">
                {product.attachments.map((attachment: any, index: number) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20"
                  >
                    <div className="w-10 h-10 rounded bg-primary/20 flex items-center justify-center">
                      <FileIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-primary truncate">
                        {attachment.name || `Attachment ${index + 1}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(attachment.size || 0)}
                      </p>
                    </div>
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>
          )}

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

          <Separator />

          {/* Product Type Badge */}
          {product.product_type && !isOwner && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {productTypeLabels[product.product_type] || product.product_type}
              </Badge>
              <span className="text-lg font-semibold">
                {formatPrice(product.price_cents, product.pricing_type, product.currency)}
              </span>
            </div>
          )}
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
                    <BadgeCheck className="w-4 h-4 text-primary" />
                  )}
                </h3>
                {product.creator.bio && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {product.creator.bio}
                  </p>
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

          {/* Related Creators */}
          {relatedCreators.length > 0 && (
            <Card className="bg-card">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">Related Creators</h3>
                <div className="space-y-3">
                  {relatedCreators.slice(0, 5).map((creator) => (
                    <Link 
                      key={creator.id} 
                      to={`/@${creator.username}`}
                      className="flex items-center gap-3 hover:bg-secondary/30 rounded-lg p-2 -mx-2 transition-colors"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={creator.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {creator.username?.[0]?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate flex items-center gap-1">
                          {creator.full_name || creator.username}
                          {creator.verified && (
                            <BadgeCheck className="w-3 h-3 text-primary" />
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">@{creator.username}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Follow Creator Dialog */}
      <Dialog open={showFollowDialog} onOpenChange={setShowFollowDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Follow Required</DialogTitle>
            <DialogDescription className="text-center">
              You must follow @{product?.creator?.username} to access this content.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {product?.creator && (
              <Avatar className="w-20 h-20">
                <AvatarImage src={product.creator.avatar_url || undefined} />
                <AvatarFallback className="text-2xl">
                  {product.creator.username?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
          <DialogFooter className="sm:justify-center">
            <Button
              onClick={handleFollowCreator}
              disabled={followingCreator}
              className="w-full bg-gradient-to-r from-primary to-accent"
            >
              {followingCreator ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Following...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Follow Now
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
