import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const productTypes = [
  { value: "preset", label: "Preset Pack" },
  { value: "lut", label: "LUT Pack" },
  { value: "sfx", label: "Sound Effects" },
  { value: "music", label: "Music" },
  { value: "template", label: "Template" },
  { value: "overlay", label: "Overlay" },
  { value: "font", label: "Font" },
  { value: "tutorial", label: "Tutorial" },
  { value: "project_file", label: "Project File" },
  { value: "transition", label: "Transition Pack" },
  { value: "color_grading", label: "Color Grading" },
  { value: "motion_graphics", label: "Motion Graphics" },
  { value: "other", label: "Other" },
];

// Helper to generate slug from title
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens
    .substring(0, 100);       // Limit length
};

export default function CreateProduct() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isCreator, setIsCreator] = useState<boolean | null>(null);
  const [checkingCreator, setCheckingCreator] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [customSlug, setCustomSlug] = useState(false);
  const [description, setDescription] = useState("");
  const [productType, setProductType] = useState("");
  const [pricingType, setPricingType] = useState("free");
  const [price, setPrice] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [previewVideo, setPreviewVideo] = useState<File | null>(null);
  const [previewVideoPreview, setPreviewVideoPreview] = useState<string | null>(null);
  const [downloadFile, setDownloadFile] = useState<File | null>(null);

  // Check if user is an approved creator
  useEffect(() => {
    const checkCreatorStatus = async () => {
      if (!user) {
        setCheckingCreator(false);
        return;
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_creator')
        .eq('user_id', user.id)
        .maybeSingle();
      
      setIsCreator(profile?.is_creator || false);
      setCheckingCreator(false);
    };
    
    checkCreatorStatus();
  }, [user]);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handlePreviewVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewVideo(file);
      setPreviewVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleDownloadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDownloadFile(file);
    }
  };


  const handleSubmit = async (e: React.FormEvent, publish: boolean) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please sign in to create a product");
      return;
    }

    if (!name.trim()) {
      toast.error("Please enter a product name");
      return;
    }

    setLoading(true);

    try {
      // Get user's profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profileError) throw profileError;

      let coverImageUrl: string | null = null;
      let previewVideoPath: string | null = null;
      let downloadUrl: string | null = null;

      // Upload cover image
      if (coverImage) {
        const ext = coverImage.name.split(".").pop();
        const path = `covers/${profile.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("product-media")
          .upload(path, coverImage);

        if (uploadError) throw uploadError;

        const { data: publicUrl } = supabase.storage
          .from("product-media")
          .getPublicUrl(path);
        
        coverImageUrl = publicUrl.publicUrl;
      }

      // Upload preview video
      if (previewVideo) {
        const ext = previewVideo.name.split(".").pop();
        // Use consistent path format: previews/{profile_id}/{timestamp}.{ext}
        previewVideoPath = `previews/${profile.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("product-media")
          .upload(previewVideoPath, previewVideo, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Preview video upload error:', uploadError);
          throw uploadError;
        }
      }

      // Upload download file to private bucket
      if (downloadFile) {
        const ext = downloadFile.name.split(".").pop();
        // Store in private bucket with user's ID as folder for RLS policy
        const path = `${user.id}/${Date.now()}-${downloadFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const { error: uploadError } = await supabase.storage
          .from("product-files")
          .upload(path, downloadFile);

        if (uploadError) {
          console.error('Download file upload error:', uploadError);
          throw uploadError;
        }

        // Store the path (not public URL) - downloads will use signed URLs
        downloadUrl = path;
      }

      // Create product
      const priceCents = (pricingType === "free" || pricingType === "subscription") ? 0 : Math.round(parseFloat(price) * 100);
      
      // Map pricing type to subscription_access
      let subscriptionAccess = 'none';
      if (pricingType === 'subscription') subscriptionAccess = 'subscription_only';
      else if (pricingType === 'both') subscriptionAccess = 'both';

      // Check slug uniqueness if provided
      const finalSlug = slug.trim() || null;
      if (finalSlug) {
        const { data: existingSlug } = await supabase
          .from("products")
          .select("id")
          .eq("slug", finalSlug)
          .maybeSingle();
        
        if (existingSlug) {
          toast.error("This URL slug is already taken. Please choose another.");
          setLoading(false);
          return;
        }
      }

      const { data: product, error } = await supabase
        .from("products")
        .insert({
          name,
          description,
          slug: finalSlug,
          product_type: productType || null,
          pricing_type: pricingType === 'subscription' ? 'paid' : pricingType === 'both' ? 'paid' : pricingType,
          price_cents: priceCents,
          currency: "USD",
          youtube_url: youtubeUrl || null,
          tags: null,
          cover_image_url: coverImageUrl,
          preview_video_url: previewVideoPath,
          download_url: downloadUrl,
          creator_id: profile.id,
          status: publish ? "published" : "draft",
          subscription_access: subscriptionAccess,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(publish ? "Product published!" : "Draft saved!");
      navigate(product.slug ? `/p/${product.slug}` : `/product/${product.id}`);
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error("Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
        <p className="text-muted-foreground mb-8">Please sign in to create products.</p>
        <Button onClick={() => navigate("/login")}>Sign In</Button>
      </div>
    );
  }

  if (checkingCreator) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!isCreator) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
          <Upload className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-4">Become a Seller First</h1>
        <p className="text-muted-foreground mb-8">
          To sell products on our platform, you need to switch your account to a seller account from your profile.
        </p>
        <Button onClick={() => navigate("/profile")}>Go to Profile</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">Create New Product</h1>

      <form className="space-y-8">
        {/* Basic Info */}
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!customSlug) {
                    setSlug(generateSlug(e.target.value));
                  }
                }}
                placeholder="My Awesome Product"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="slug">Custom URL Slug</Label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">/p/</span>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => {
                      setSlug(generateSlug(e.target.value));
                      setCustomSlug(true);
                    }}
                    placeholder="my-awesome-product"
                    className="flex-1 font-mono text-sm"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {slug ? (
                    <>Preview: <span className="font-mono text-primary">editorsparadise.com/p/{slug}</span></>
                  ) : (
                    "Leave empty to auto-generate from title"
                  )}
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your product..."
                rows={5}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="type">Product Type</Label>
              <Select value={productType} onValueChange={setProductType}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  {productTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Pricing Type</Label>
              <div className="flex flex-wrap gap-3 mt-2">
                <Button
                  type="button"
                  variant={pricingType === "free" ? "default" : "outline"}
                  onClick={() => setPricingType("free")}
                >
                  Free
                </Button>
                <Button
                  type="button"
                  variant={pricingType === "paid" ? "default" : "outline"}
                  onClick={() => setPricingType("paid")}
                >
                  One-Time Purchase
                </Button>
                <Button
                  type="button"
                  variant={pricingType === "subscription" ? "default" : "outline"}
                  onClick={() => setPricingType("subscription")}
                >
                  Subscription Only
                </Button>
                <Button
                  type="button"
                  variant={pricingType === "both" ? "default" : "outline"}
                  onClick={() => setPricingType("both")}
                >
                  Both (One-Time + Subscription)
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {pricingType === "subscription" && "Only users subscribed to one of your plans can access this product."}
                {pricingType === "both" && "Users can buy once OR get access through their subscription."}
              </p>
            </div>

            {(pricingType === "paid" || pricingType === "both") && (
              <div>
                <Label htmlFor="price">One-Time Price (USD)</Label>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="9.99"
                    className="pl-8"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Media */}
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle>Media</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Cover Image */}
            <div>
              <Label>Cover Image</Label>
              <div className="mt-2">
                {coverPreview ? (
                  <div className="relative">
                    <img
                      src={coverPreview}
                      alt="Cover preview"
                      className="w-full aspect-video object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setCoverImage(null);
                        setCoverPreview(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-border/50 rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">
                      Click to upload cover image
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Preview Video */}
            <div>
              <Label>Preview Video (loops on hover)</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Short video clip that plays when hovering over your product card
              </p>
              <div className="mt-2">
                {previewVideoPreview ? (
                  <div className="relative">
                    <video
                      src={previewVideoPreview}
                      className="w-full aspect-video object-cover rounded-lg"
                      controls
                      muted
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setPreviewVideo(null);
                        setPreviewVideoPreview(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full py-8 border-2 border-dashed border-border/50 rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">
                      Click to upload preview video
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      MP4, WebM (max 30 seconds recommended)
                    </span>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handlePreviewVideoChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* YouTube URL */}
            <div>
              <Label htmlFor="youtube">YouTube Video URL (Optional)</Label>
              <Input
                id="youtube"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="mt-2"
              />
            </div>

            {/* Download File */}
            <div>
              <Label>Product File</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Upload any file type (ZIP, RAR, 7z, etc.) - stored securely and only accessible to buyers/subscribers
              </p>
              <div className="mt-2">
                {downloadFile ? (
                  <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/20">
                    <div className="flex flex-col min-w-0 flex-1 mr-2">
                      <span className="text-sm font-medium truncate">{downloadFile.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {(downloadFile.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setDownloadFile(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full py-8 border-2 border-dashed border-border/50 rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">
                      Click to upload product file
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      ZIP, RAR, 7z, PDF, and other file types supported
                    </span>
                    <input
                      type="file"
                      onChange={handleDownloadChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={(e) => handleSubmit(e, false)}
            disabled={loading}
            className="flex-1"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save as Draft
          </Button>
          <Button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-primary to-accent"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Publish Product
          </Button>
        </div>
      </form>
    </div>
  );
}
