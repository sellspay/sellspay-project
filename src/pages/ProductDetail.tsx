import { useState, useEffect } from "react";
import { useParams, Link, useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Download, Share2, Heart, MessageCircle, Calendar, Loader2, CheckCircle, Pencil, Trash2, FileIcon, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

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
  } | null;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface RelatedProduct {
  id: string;
  name: string;
  cover_image_url: string | null;
  price_cents: number | null;
  currency: string | null;
}

interface RelatedCreator {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
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
  
  // Comments
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [showAllComments, setShowAllComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  
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
          .select("id, username, full_name, avatar_url, bio")
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
        .select("id, name, cover_image_url, price_cents, currency")
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
        .select("id, username, full_name, avatar_url")
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
      const { data, count } = await supabase
        .from("comments")
        .select("*", { count: "exact" })
        .eq("product_id", id)
        .order("created_at", { ascending: false })
        .limit(10);
      
      setCommentCount(count || 0);
      
      // Fetch user info for each comment
      if (data) {
        const commentsWithUsers = await Promise.all(
          data.map(async (comment) => {
            const { data: profile } = await supabase
              .from("profiles")
              .select("username, full_name, avatar_url")
              .eq("id", comment.user_id)
              .maybeSingle();
            return { ...comment, user: profile };
          })
        );
        setComments(commentsWithUsers);
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
    
    if (!userProfileId || !id || !newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const { error } = await supabase
        .from("comments")
        .insert({
          product_id: id,
          user_id: userProfileId,
          content: newComment.trim(),
        });

      if (error) throw error;

      setNewComment("");
      fetchComments();
      toast.success("Comment posted!");
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Failed to post comment");
    } finally {
      setSubmittingComment(false);
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

          {/* Title & Meta */}
          <div>
            <h1 className="text-2xl font-bold mb-3">{product.name}</h1>
            
            <div className="flex items-center gap-4 mb-4">
              {/* Creator Mini */}
              {product.creator && (
                <Link to={`/@${product.creator.username}`} className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={product.creator.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {product.creator.full_name?.[0] || product.creator.username?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hover:text-primary transition-colors">
                    {product.creator.full_name || product.creator.username}
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

          <Separator />

          {/* Description */}
          <div>
            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {product.description || "No description provided."}
            </p>
          </div>

          {/* Attachments */}
          {product.attachments && Array.isArray(product.attachments) && product.attachments.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3">Attachments</h3>
                <div className="space-y-2">
                  {product.attachments.map((attachment: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border">
                      <FileIcon className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm">{attachment.name || `Attachment ${index + 1}`}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Purchase Section */}
          <Card className="bg-card border-2 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">
                    {formatPrice(product.price_cents, product.pricing_type, product.currency)}
                  </p>
                  {product.product_type && (
                    <Badge variant="secondary" className="mt-1">
                      {productTypeLabels[product.product_type] || product.product_type}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  {hasPurchased ? (
                    <Button className="bg-emerald-600/90 hover:bg-emerald-600" disabled>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Purchased
                    </Button>
                  ) : product.pricing_type === "free" ? (
                    <Button className="bg-gradient-to-r from-primary to-accent">
                      <Download className="w-4 h-4 mr-2" />
                      Download Free
                    </Button>
                  ) : (
                    <Button 
                      className="bg-gradient-to-r from-primary to-accent"
                      onClick={handlePurchase}
                      disabled={purchasing}
                    >
                      {purchasing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>Buy for {formatPrice(product.price_cents, product.pricing_type, product.currency)}</>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments Section */}
          <div>
            <h3 className="font-semibold mb-4">Comments ({commentCount})</h3>
            
            {/* New Comment Input */}
            {user && (
              <div className="flex gap-3 mb-6">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="min-h-[80px]"
                />
                <Button 
                  onClick={handleSubmitComment} 
                  disabled={submittingComment || !newComment.trim()}
                  size="icon"
                  className="h-auto"
                >
                  {submittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {displayedComments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={comment.user?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {comment.user?.full_name?.[0] || comment.user?.username?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {comment.user?.full_name || comment.user?.username || "Anonymous"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{comment.content}</p>
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
                  className="w-full"
                  onClick={() => setShowAllComments(true)}
                >
                  Show more comments ({comments.length - 4} more)
                </Button>
              )}
            </div>
          </div>
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
                    {product.creator.full_name?.[0] || product.creator.username?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold">
                  {product.creator.full_name || product.creator.username}
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
                  {relatedProducts.slice(0, 5).map((prod) => (
                    <Link 
                      key={prod.id} 
                      to={`/product/${prod.id}`}
                      className="flex items-center gap-3 hover:bg-secondary/30 rounded-lg p-2 -mx-2 transition-colors"
                    >
                      {prod.cover_image_url ? (
                        <img 
                          src={prod.cover_image_url} 
                          alt={prod.name} 
                          className="w-12 h-12 rounded object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
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
                  ))}
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
                          {creator.full_name?.[0] || creator.username?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {creator.full_name || creator.username}
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
    </div>
  );
}
