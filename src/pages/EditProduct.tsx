import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Upload, X, Loader2, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const productTypes = [
  { value: "preset", label: "Preset Pack" },
  { value: "lut", label: "LUT Pack" },
  { value: "sfx", label: "Sound Effects" },
  { value: "music", label: "Music" },
  { value: "template", label: "Template" },
  { value: "overlay", label: "Overlay" },
  { value: "font", label: "Font" },
  { value: "other", label: "Other" },
];

export default function EditProduct() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [productType, setProductType] = useState("");
  const [pricingType, setPricingType] = useState("free");
  const [price, setPrice] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [status, setStatus] = useState("draft");
  
  // Existing media URLs
  const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(null);
  const [existingPreviewVideoPath, setExistingPreviewVideoPath] = useState<string | null>(null);
  const [existingDownloadUrl, setExistingDownloadUrl] = useState<string | null>(null);
  
  // New uploads
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [previewVideo, setPreviewVideo] = useState<File | null>(null);
  const [previewVideoPreview, setPreviewVideoPreview] = useState<string | null>(null);
  const [downloadFile, setDownloadFile] = useState<File | null>(null);
  
  // Track if we should remove existing media
  const [removeCover, setRemoveCover] = useState(false);
  const [removePreviewVideo, setRemovePreviewVideo] = useState(false);
  const [removeDownload, setRemoveDownload] = useState(false);

  useEffect(() => {
    if (id && user) {
      fetchProduct();
    }
  }, [id, user]);

  const fetchProduct = async () => {
    try {
      // Get user's profile first
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (!profile) {
        toast.error("Profile not found");
        navigate("/products");
        return;
      }

      const { data: product, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      
      if (!product) {
        toast.error("Product not found");
        navigate("/products");
        return;
      }

      // Check if user owns this product
      if (product.creator_id !== profile.id) {
        toast.error("You don't have permission to edit this product");
        navigate("/products");
        return;
      }

      // Populate form
      setName(product.name);
      setDescription(product.description || "");
      setProductType(product.product_type || "");
      setPricingType(product.pricing_type || "free");
      setPrice(product.price_cents ? (product.price_cents / 100).toString() : "");
      setYoutubeUrl(product.youtube_url || "");
      setTags(product.tags || []);
      setStatus(product.status || "draft");
      setExistingCoverUrl(product.cover_image_url);
      setExistingPreviewVideoPath(product.preview_video_url);
      setExistingDownloadUrl(product.download_url);
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Failed to load product");
      navigate("/products");
    } finally {
      setLoading(false);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      setCoverPreview(URL.createObjectURL(file));
      setRemoveCover(false);
    }
  };

  const handlePreviewVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewVideo(file);
      setPreviewVideoPreview(URL.createObjectURL(file));
      setRemovePreviewVideo(false);
    }
  };

  const handleDownloadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDownloadFile(file);
      setRemoveDownload(false);
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const getPreviewVideoUrl = (path: string | null): string | null => {
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

  const handleSubmit = async (e: React.FormEvent, publish: boolean) => {
    e.preventDefault();
    
    if (!user || !id) return;

    if (!name.trim()) {
      toast.error("Please enter a product name");
      return;
    }

    setSaving(true);

    try {
      // Get user's profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profileError) throw profileError;

      let coverImageUrl: string | null = existingCoverUrl;
      let previewVideoPath: string | null = existingPreviewVideoPath;
      let downloadUrl: string | null = existingDownloadUrl;

      // Handle cover image
      if (removeCover) {
        coverImageUrl = null;
      } else if (coverImage) {
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

      // Handle preview video
      if (removePreviewVideo) {
        previewVideoPath = null;
      } else if (previewVideo) {
        const ext = previewVideo.name.split(".").pop();
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

      // Handle download file
      if (removeDownload) {
        downloadUrl = null;
      } else if (downloadFile) {
        const ext = downloadFile.name.split(".").pop();
        const path = `downloads/${profile.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("product-media")
          .upload(path, downloadFile);

        if (uploadError) throw uploadError;

        const { data: publicUrl } = supabase.storage
          .from("product-media")
          .getPublicUrl(path);
        
        downloadUrl = publicUrl.publicUrl;
      }

      // Update product
      const priceCents = pricingType === "free" ? 0 : Math.round(parseFloat(price) * 100);

      const { error } = await supabase
        .from("products")
        .update({
          name,
          description,
          product_type: productType || null,
          pricing_type: pricingType,
          price_cents: priceCents,
          youtube_url: youtubeUrl || null,
          tags: tags.length > 0 ? tags : null,
          cover_image_url: coverImageUrl,
          preview_video_url: previewVideoPath,
          download_url: downloadUrl,
          status: publish ? "published" : "draft",
        })
        .eq("id", id);

      if (error) throw error;

      toast.success(publish ? "Product published!" : "Changes saved!");
      navigate(`/product/${id}`);
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
        <p className="text-muted-foreground mb-8">
          Please sign in to edit products.
        </p>
        <Button onClick={() => navigate("/login")}>Sign In</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Button variant="ghost" asChild className="mb-6">
        <Link to={`/product/${id}`}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Product
        </Link>
      </Button>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Edit Product</h1>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={deleting}>
              {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete Product
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
                onChange={(e) => setName(e.target.value)}
                placeholder="My Awesome Product"
                className="mt-2"
              />
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
              <div className="flex gap-4 mt-2">
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
                  Paid
                </Button>
              </div>
            </div>

            {pricingType === "paid" && (
              <div>
                <Label htmlFor="price">Price (USD)</Label>
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
                ) : existingCoverUrl && !removeCover ? (
                  <div className="relative">
                    <img
                      src={existingCoverUrl}
                      alt="Current cover"
                      className="w-full aspect-video object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => setRemoveCover(true)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <label className="absolute bottom-2 right-2">
                      <Button type="button" variant="secondary" size="sm" asChild>
                        <span>Replace</span>
                      </Button>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverChange}
                        className="hidden"
                      />
                    </label>
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
                ) : existingPreviewVideoPath && !removePreviewVideo ? (
                  <div className="relative">
                    <video
                      src={getPreviewVideoUrl(existingPreviewVideoPath) || undefined}
                      className="w-full aspect-video object-cover rounded-lg"
                      controls
                      muted
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => setRemovePreviewVideo(true)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <label className="absolute bottom-2 right-2">
                      <Button type="button" variant="secondary" size="sm" asChild>
                        <span>Replace</span>
                      </Button>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handlePreviewVideoChange}
                        className="hidden"
                      />
                    </label>
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
              <div className="mt-2">
                {downloadFile ? (
                  <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/20">
                    <span className="text-sm truncate">{downloadFile.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setDownloadFile(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : existingDownloadUrl && !removeDownload ? (
                  <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/20">
                    <span className="text-sm truncate">Current file attached</span>
                    <div className="flex gap-2">
                      <label>
                        <Button type="button" variant="secondary" size="sm" asChild>
                          <span>Replace</span>
                        </Button>
                        <input
                          type="file"
                          onChange={handleDownloadChange}
                          className="hidden"
                        />
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setRemoveDownload(true)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full py-8 border-2 border-dashed border-border/50 rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">
                      Click to upload product file
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

        {/* Tags */}
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag}>
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={(e) => handleSubmit(e, false)}
            disabled={saving}
            className="flex-1"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save as Draft
          </Button>
          <Button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={saving}
            className="flex-1 bg-gradient-to-r from-primary to-accent"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {status === "published" ? "Update & Publish" : "Publish"}
          </Button>
        </div>
      </form>
    </div>
  );
}

