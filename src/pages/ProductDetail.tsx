import { useState, useEffect } from "react";
import { useParams, Link, useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Download, Share2, Heart, Tag, Calendar, Loader2, CheckCircle, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
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
  tags: string[] | null;
  download_url: string | null;
  created_at: string | null;
  creator: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

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
      // Clean up URL
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
    }
  }, [id, userProfileId]);

  const fetchProduct = async () => {
    try {
      // Fetch product first
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

      // Fetch creator separately since FK was removed for migration
      let creator = null;
      if (productData.creator_id) {
        const { data: creatorData } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url")
          .eq("id", productData.creator_id)
          .maybeSingle();
        creator = creatorData;
        
        // Check if current user owns this product
        if (userProfileId && productData.creator_id === userProfileId) {
          setIsOwner(true);
        }
      }

      setProduct({ ...productData, creator });
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const fetchLikes = async () => {
    if (!id) return;
    
    try {
      // Get like count
      const { count } = await supabase
        .from("product_likes")
        .select("*", { count: "exact", head: true })
        .eq("product_id", id);
      
      setLikeCount(count || 0);

      // Check if current user has liked
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
        // Unlike
        await supabase
          .from("product_likes")
          .delete()
          .eq("product_id", id)
          .eq("user_id", userProfileId);
        
        setIsLiked(false);
        setLikeCount((prev) => Math.max(0, prev - 1));
      } else {
        // Like
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
      year: "numeric",
      month: "long",
      day: "numeric",
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
    // Handle both full URLs and just video IDs
    if (url.length === 11 && !url.includes('/')) {
      return `https://www.youtube.com/embed/${url}`;
    }
    const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  // Build full storage URL for preview videos from source Supabase
  const getVideoUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    // Path is relative to source Supabase storage
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
          <div className="grid md:grid-cols-2 gap-8">
            <div className="aspect-video bg-muted rounded-xl" />
            <div className="space-y-4">
              <div className="h-10 bg-muted rounded w-3/4" />
              <div className="h-6 bg-muted rounded w-1/4" />
              <div className="h-24 bg-muted rounded" />
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Back Button & Owner Actions */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" asChild>
          <Link to="/products">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Link>
        </Button>
        
        {isOwner && (
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to={`/edit-product/${id}`}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={deleting}>
                  {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                  Delete
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

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Media */}
          <div className="rounded-xl overflow-hidden bg-card/50 border border-border/50">
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

          {/* Description */}
          <Card className="bg-card/50">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">About this product</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {product.description || "No description provided."}
              </p>
            </CardContent>
          </Card>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <Card className="bg-card/50">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Tags
                </h2>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Info Card */}
          <Card className="bg-card/50 sticky top-4">
            <CardContent className="p-6 space-y-6">
              <div>
                <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
                <p className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {formatPrice(product.price_cents, product.pricing_type, product.currency)}
                </p>
              </div>

              <div className="flex gap-3">
                {hasPurchased ? (
                  <Button className="flex-1 bg-emerald-600/90 hover:bg-emerald-600" size="lg" disabled>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Purchased
                  </Button>
                ) : product.pricing_type === "free" ? (
                  <Button className="flex-1 bg-gradient-to-r from-primary to-accent" size="lg">
                    <Download className="w-4 h-4 mr-2" />
                    Download Free
                  </Button>
                ) : (
                  <Button 
                    className="flex-1 bg-gradient-to-r from-primary to-accent" 
                    size="lg"
                    onClick={handlePurchase}
                    disabled={purchasing}
                  >
                    {purchasing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Purchase"
                    )}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleLike}
                  className="gap-2"
                >
                  <Heart className={`w-4 h-4 ${isLiked ? "fill-destructive text-destructive" : ""}`} />
                  {likeCount > 0 && <span>{likeCount}</span>}
                </Button>
                <Button variant="outline" size="lg" onClick={handleShare}>
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>

              <Separator />

              {/* Creator Info */}
              {product.creator && (
                <Link
                  to={`/@${product.creator.username}`}
                  className="flex items-center gap-4 p-4 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-colors"
                >
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={product.creator.avatar_url || undefined} />
                    <AvatarFallback>
                      {product.creator.full_name?.[0] || product.creator.username?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">
                      {product.creator.full_name || product.creator.username}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      @{product.creator.username}
                    </p>
                  </div>
                </Link>
              )}

              <Separator />

              {/* Details */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Published {formatDate(product.created_at)}</span>
                </div>
                {product.product_type && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Tag className="w-4 h-4" />
                    <span className="capitalize">{product.product_type}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
