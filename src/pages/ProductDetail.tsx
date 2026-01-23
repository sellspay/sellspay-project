import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Play, Download, Share2, Heart, Tag, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          creator:profiles!products_creator_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Failed to load product");
    } finally {
      setLoading(false);
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

  const getYouTubeEmbedUrl = (url: string | null) => {
    if (!url) return null;
    const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
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
      {/* Back Button */}
      <Button variant="ghost" asChild className="mb-6">
        <Link to="/products">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Link>
      </Button>

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
                src={product.preview_video_url}
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
                <Button className="flex-1 bg-gradient-to-r from-primary to-accent" size="lg">
                  {product.pricing_type === "free" ? (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download Free
                    </>
                  ) : (
                    "Purchase"
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setIsLiked(!isLiked)}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? "fill-destructive text-destructive" : ""}`} />
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
