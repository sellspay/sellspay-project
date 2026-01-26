import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Upload, X, Loader2, Trash2, ArrowLeft, Camera, Check, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import VideoTrimmer from "@/components/product/VideoTrimmer";
import VideoFrameSelector from "@/components/product/VideoFrameSelector";
import UploadProgressOverlay from "@/components/product/UploadProgressOverlay";
import { useFileUploadProgress, validateTotalFileSize, formatBytes, MAX_PRODUCT_SIZE_BYTES } from "@/hooks/useFileUploadProgress";

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

// Helper to convert YouTube video ID to full URL
const youtubeIdToUrl = (idOrUrl: string | null): string => {
  if (!idOrUrl) return "";
  // If it already looks like a URL, return as-is
  if (idOrUrl.includes("youtube.com") || idOrUrl.includes("youtu.be")) {
    return idOrUrl;
  }
  // Otherwise assume it's a video ID and convert to full URL
  return `https://www.youtube.com/watch?v=${idOrUrl}`;
};

// Helper to extract YouTube video ID from URL
const extractYoutubeId = (url: string): string => {
  if (!url) return "";
  // If it's already just an ID (no slashes or dots except in common domains)
  if (!url.includes("/") && !url.includes(".")) {
    return url;
  }
  // Extract ID from various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^?&]+)/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return url; // Return as-is if no pattern matches
};

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

export default function EditProduct() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Upload progress hook
  const { progress: uploadProgress, uploadFiles, resetProgress, setPhase } = useFileUploadProgress();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [existingSlug, setExistingSlug] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [productType, setProductType] = useState("");
  const [pricingType, setPricingType] = useState("free");
  const [price, setPrice] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [status, setStatus] = useState("draft");
  
  // Existing media URLs
  const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(null);
  const [existingPreviewVideoPath, setExistingPreviewVideoPath] = useState<string | null>(null);
  const [existingDownloadUrl, setExistingDownloadUrl] = useState<string | null>(null);
  const [existingOriginalFilename, setExistingOriginalFilename] = useState<string | null>(null);
  const [existingAttachments, setExistingAttachments] = useState<{ name: string; path: string; size: number }[]>([]);
  
  // New uploads
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [previewVideo, setPreviewVideo] = useState<File | null>(null);
  const [previewVideoPreview, setPreviewVideoPreview] = useState<string | null>(null);
  const [newDownloadFiles, setNewDownloadFiles] = useState<File[]>([]);
  
  // Track which existing attachments to remove
  const [removeCover, setRemoveCover] = useState(false);
  const [removePreviewVideo, setRemovePreviewVideo] = useState(false);
  
  // Video trimmer and frame selector states
  const [showTrimmer, setShowTrimmer] = useState(false);
  const [trimStart, setTrimStart] = useState<number | null>(null);
  const [trimEnd, setTrimEnd] = useState<number | null>(null);
  const [showFrameSelector, setShowFrameSelector] = useState(false);
  
  // Drag and drop refs
  const fileDropRef = useRef<HTMLDivElement>(null);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [attachmentsToRemove, setAttachmentsToRemove] = useState<string[]>([]);
  
  // Compute total file size for validation (existing + new - removed)
  const visibleExistingSize = existingAttachments
    .filter(att => !attachmentsToRemove.includes(att.path))
    .reduce((acc, att) => acc + (att.size || 0), 0);
  const newFilesSize = newDownloadFiles.reduce((acc, f) => acc + f.size, 0);
  const totalFileSize = visibleExistingSize + newFilesSize;
  const isOverSizeLimit = totalFileSize > MAX_PRODUCT_SIZE_BYTES;

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
      setSlug(product.slug || "");
      setExistingSlug(product.slug || null);
      setDescription(product.description || "");
      setProductType(product.product_type || "");
      // Map subscription_access back to pricingType
      let mappedPricingType = product.pricing_type || "free";
      if (product.subscription_access === 'subscription_only') {
        mappedPricingType = 'subscription';
      } else if (product.subscription_access === 'both') {
        mappedPricingType = 'both';
      }
      setPricingType(mappedPricingType);
      setPrice(product.price_cents ? (product.price_cents / 100).toString() : "");
      // Convert YouTube ID to full URL for display
      setYoutubeUrl(youtubeIdToUrl(product.youtube_url));
      setStatus(product.status || "draft");
      setExistingCoverUrl(product.cover_image_url);
      setExistingPreviewVideoPath(product.preview_video_url);
      setExistingDownloadUrl(product.download_url);
      setExistingOriginalFilename((product as any).original_filename || null);
      
      // Load existing attachments
      const attachments = (product as any).attachments;
      if (attachments && Array.isArray(attachments)) {
        setExistingAttachments(attachments);
      } else if (product.download_url) {
        // Migrate old single-file format to attachments array for display
        setExistingAttachments([{
          name: (product as any).original_filename || product.download_url.split('/').pop() || 'Download File',
          path: product.download_url,
          size: 0,
        }]);
      }
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
      setShowTrimmer(true);
      setTrimStart(null);
      setTrimEnd(null);
    }
  };

  const handleDownloadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setNewDownloadFiles(prev => [...prev, ...Array.from(files)]);
    }
    e.target.value = '';
  };
  
  // Video trim handler
  const handleTrimConfirm = (start: number, end: number) => {
    setTrimStart(start);
    setTrimEnd(end);
    setShowTrimmer(false);
    toast.success(`Preview clip set: ${start.toFixed(1)}s - ${end.toFixed(1)}s`);
  };
  
  // Frame selector handler
  const handleFrameSelect = (blob: Blob, dataUrl: string) => {
    const file = new File([blob], `cover-frame-${Date.now()}.jpg`, { type: 'image/jpeg' });
    setCoverImage(file);
    setCoverPreview(dataUrl);
    setRemoveCover(false);
    setShowFrameSelector(false);
    toast.success("Cover image set from video frame");
  };
  
  // Drag and drop for files/folders
  const getFilesFromDataTransferItems = async (items: DataTransferItemList): Promise<File[]> => {
    const files: File[] = [];
    
    const traverseDirectory = async (entry: FileSystemEntry): Promise<void> => {
      if (entry.isFile) {
        const fileEntry = entry as FileSystemFileEntry;
        return new Promise((resolve) => {
          fileEntry.file((file) => {
            files.push(file);
            resolve();
          });
        });
      } else if (entry.isDirectory) {
        const dirEntry = entry as FileSystemDirectoryEntry;
        const reader = dirEntry.createReader();
        return new Promise((resolve) => {
          const readEntries = () => {
            reader.readEntries(async (entries) => {
              if (entries.length === 0) {
                resolve();
              } else {
                for (const entry of entries) {
                  await traverseDirectory(entry);
                }
                readEntries();
              }
            });
          };
          readEntries();
        });
      }
    };
    
    const entries: FileSystemEntry[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.webkitGetAsEntry) {
        const entry = item.webkitGetAsEntry();
        if (entry) entries.push(entry);
      }
    }
    
    for (const entry of entries) {
      await traverseDirectory(entry);
    }
    
    return files;
  };
  
  const handleFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFiles(false);
    
    const items = e.dataTransfer.items;
    if (items && items.length > 0) {
      const files = await getFilesFromDataTransferItems(items);
      if (files.length > 0) {
        setNewDownloadFiles(prev => [...prev, ...files]);
        toast.success(`Added ${files.length} file${files.length > 1 ? 's' : ''}`);
      }
    }
  };
  
  const handleFileDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFiles(true);
  };
  
  const handleFileDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFiles(false);
  };

  const removeNewDownloadFile = (index: number) => {
    setNewDownloadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const markExistingAttachmentForRemoval = (path: string) => {
    setAttachmentsToRemove(prev => [...prev, path]);
  };

  const getVisibleExistingAttachments = () => {
    return existingAttachments.filter(att => !attachmentsToRemove.includes(att.path));
  };
  const getPreviewVideoUrl = (path: string | null): string | null => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const { data } = supabase.storage.from('product-media').getPublicUrl(path);
    return data?.publicUrl || null;
  };

  const [isDeleted, setIsDeleted] = useState(false);

  const handleDelete = async () => {
    if (!id) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Mark as deleted for animation
      setIsDeleted(true);
      
      // Show success toast with animation delay
      toast.success("Product deleted successfully", {
        description: "Redirecting to your products...",
        duration: 2000,
      });
      
      // Wait for animation then navigate
      setTimeout(() => {
        navigate("/profile");
      }, 800);
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
      setDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, publish: boolean) => {
    e.preventDefault();
    
    if (!user || !id) return;
    
    // Safety check: prevent saving if product data hasn't loaded
    if (loading) {
      toast.error("Please wait for the product to load");
      return;
    }

    if (!name.trim()) {
      toast.error("Please enter a product name");
      return;
    }

    // Validate minimum price for paid products
    if ((pricingType === "paid" || pricingType === "both") && parseFloat(price) < 4.99) {
      toast.error("Minimum price is $4.99 for paid products");
      return;
    }

    // Validate 5GB file size limit
    if (newDownloadFiles.length > 0) {
      const validation = validateTotalFileSize(newDownloadFiles);
      if (!validation.valid) {
        toast.error(validation.message);
        return;
      }
    }

    setSaving(true);
    if (publish) {
      setIsPublishing(true);
      resetProgress();
    }

    try {
      // Get user's profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profileError) throw profileError;

      let coverImageUrl: string | null = existingCoverUrl;
      let previewVideoPath: string | null = existingPreviewVideoPath;

      // Handle cover image (small file, use standard upload)
      if (removeCover) {
        coverImageUrl = null;
      } else if (coverImage) {
        const ext = coverImage.name.split(".").pop();
        const path = `covers/${profileData.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("product-media")
          .upload(path, coverImage);

        if (uploadError) throw uploadError;

        const { data: publicUrl } = supabase.storage
          .from("product-media")
          .getPublicUrl(path);
        
        coverImageUrl = publicUrl.publicUrl;
      }

      // Handle preview video (small file, use standard upload)
      if (removePreviewVideo) {
        previewVideoPath = null;
      } else if (previewVideo) {
        const ext = previewVideo.name.split(".").pop();
        previewVideoPath = `previews/${profileData.id}/${Date.now()}.${ext}`;
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

      // Handle attachments - combine existing (minus removed) with new uploads
      let finalAttachments: { name: string; path: string; size: number }[] = [];
      
      // Keep existing attachments that weren't marked for removal
      finalAttachments = existingAttachments.filter(att => !attachmentsToRemove.includes(att.path));
      
      // Upload new files with real progress tracking
      if (newDownloadFiles.length > 0) {
        const uploadResult = await uploadFiles(
          newDownloadFiles,
          'product-files',
          (file, index) => `${user.id}/${Date.now()}-${index}-${file.name.replace(/[^a-zA-Z0-9._()-]/g, '_')}`
        );

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Failed to upload files');
        }

        // Add uploaded files to attachments
        for (let i = 0; i < newDownloadFiles.length; i++) {
          finalAttachments.push({
            name: newDownloadFiles[i].name,
            path: uploadResult.paths[i],
            size: newDownloadFiles[i].size,
          });
        }
      }

      // Processing phase
      setPhase('processing');
      
      // For backward compatibility, set download_url and original_filename to first attachment
      let downloadUrlValue: string | null = null;
      let originalFilename: string | null = null;
      if (finalAttachments.length > 0) {
        downloadUrlValue = finalAttachments[0].path;
        originalFilename = finalAttachments[0].name;
      }

      // Check slug uniqueness if changed
      const finalSlug = slug.trim() || null;
      if (finalSlug && finalSlug !== existingSlug) {
        const { data: slugCheck } = await supabase
          .from("products")
          .select("id")
          .eq("slug", finalSlug)
          .neq("id", id)
          .maybeSingle();
        
        if (slugCheck) {
          toast.error("This URL slug is already taken. Please choose another.");
          setSaving(false);
          setIsPublishing(false);
          resetProgress();
          return;
        }
      }

      // Update product
      const priceCents = (pricingType === "free" || pricingType === "subscription") ? 0 : Math.round(parseFloat(price) * 100);
      
      // Map pricing type to subscription_access
      let subscriptionAccess = 'none';
      if (pricingType === 'subscription') subscriptionAccess = 'subscription_only';
      else if (pricingType === 'both') subscriptionAccess = 'both';

      // Extract YouTube video ID from URL for storage
      const youtubeVideoId = extractYoutubeId(youtubeUrl);

      const { error } = await supabase
        .from("products")
        .update({
          name,
          description,
          slug: finalSlug,
          product_type: productType || null,
          pricing_type: pricingType === 'subscription' ? 'paid' : pricingType === 'both' ? 'paid' : pricingType,
          price_cents: priceCents,
          youtube_url: youtubeVideoId || null,
          tags: null,
          cover_image_url: coverImageUrl,
          preview_video_url: previewVideoPath,
          download_url: downloadUrlValue,
          original_filename: originalFilename,
          attachments: finalAttachments.length > 0 ? finalAttachments : null,
          status: publish ? "published" : "draft",
          subscription_access: subscriptionAccess,
        } as any)
        .eq("id", id);

      if (error) throw error;

      // Done phase
      if (publish) {
        setPhase('done');
        await new Promise(resolve => setTimeout(resolve, 1200));
      }
      
      toast.success(publish ? "Product published!" : "Changes saved!");
      navigate(slug ? `/p/${slug}` : `/product/${id}`);
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product");
    } finally {
      setSaving(false);
      setIsPublishing(false);
      resetProgress();
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
    <>
      {/* Upload progress overlay */}
      <UploadProgressOverlay isVisible={isPublishing} progress={uploadProgress} isEdit />
      
      <div className={`container mx-auto px-4 py-8 max-w-3xl transition-all duration-500 ${isDeleted ? 'opacity-0 scale-95 translate-y-4' : 'opacity-100 scale-100'}`}>
      {/* Deletion overlay */}
      {isDeleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="text-center animate-scale-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
              <Trash2 className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Product Deleted</h2>
            <p className="text-muted-foreground">Redirecting to your profile...</p>
          </div>
        </div>
      )}

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
            <Button variant="destructive" disabled={deleting || isDeleted}>
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
              <Label htmlFor="slug">Custom URL Slug</Label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">/p/</span>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(generateSlug(e.target.value))}
                    placeholder="my-awesome-product"
                    className="flex-1 font-mono text-sm"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {slug ? (
                    <>Preview: <span className="font-mono text-primary">editorsparadise.com/p/{slug}</span></>
                  ) : (
                    "Leave empty to use product ID in URL"
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
                    min="4.99"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="4.99"
                    className="pl-8"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Minimum price is $4.99 to ensure fair payouts after payment processing fees.
                </p>
                {price && parseFloat(price) > 0 && parseFloat(price) < 4.99 && (
                  <p className="text-xs text-destructive mt-1">
                    Price must be at least $4.99
                  </p>
                )}
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
              <div className="mt-2 space-y-3">
                {/* Frame selector from video */}
                {showFrameSelector && (previewVideoPreview || existingPreviewVideoPath) && (
                  <VideoFrameSelector
                    videoSrc={previewVideoPreview || getPreviewVideoUrl(existingPreviewVideoPath) || ''}
                    onFrameSelect={handleFrameSelect}
                    onCancel={() => setShowFrameSelector(false)}
                  />
                )}
                
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
                
                {/* Option to select frame from video */}
                {!showFrameSelector && (previewVideoPreview || (existingPreviewVideoPath && !removePreviewVideo)) && !coverPreview && (existingCoverUrl ? removeCover : true) && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowFrameSelector(true)}
                    className="w-full"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Select frame from preview video
                  </Button>
                )}
              </div>
            </div>

            {/* Preview Video */}
            <div>
              <Label>Preview Video (loops on hover)</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Short video clip that plays when hovering over your product card
              </p>
              <div className="mt-2 space-y-3">
                {/* Video Trimmer */}
                {showTrimmer && previewVideoPreview && (
                  <VideoTrimmer
                    videoSrc={previewVideoPreview}
                    onTrimConfirm={handleTrimConfirm}
                    maxDuration={5}
                    minDuration={1}
                  />
                )}
                
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
                        setShowTrimmer(false);
                        setTrimStart(null);
                        setTrimEnd(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    
                    {/* Show trim info if trimmed */}
                    {trimStart !== null && trimEnd !== null && !showTrimmer && (
                      <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-primary/90 text-primary-foreground text-xs font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Clip: {trimStart.toFixed(1)}s - {trimEnd.toFixed(1)}s
                      </div>
                    )}
                    
                    {/* Re-trim button */}
                    {!showTrimmer && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="absolute bottom-2 right-2"
                        onClick={() => setShowTrimmer(true)}
                      >
                        Edit Clip
                      </Button>
                    )}
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

            {/* Product Files - Multiple with Drag & Drop */}
            <div>
              <Label>Product Files</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Upload multiple files. Maximum 5GB total per product.
              </p>
              
              {/* File size warning */}
              {(getVisibleExistingAttachments().length > 0 || newDownloadFiles.length > 0) && (
                <div className={`mb-3 p-3 rounded-lg text-sm ${isOverSizeLimit ? 'bg-destructive/10 border border-destructive/30' : 'bg-secondary/30'}`}>
                  <div className="flex justify-between items-center">
                    <span className={isOverSizeLimit ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                      Total: {formatBytes(totalFileSize)} / 5 GB
                    </span>
                    {isOverSizeLimit && (
                      <span className="text-destructive text-xs font-medium">
                        Exceeds limit
                      </span>
                    )}
                  </div>
                </div>
              )}
              <div className="mt-2 space-y-2">
                {/* List of existing files (not marked for removal) */}
                {getVisibleExistingAttachments().length > 0 && (
                  <div className="space-y-2">
                    {getVisibleExistingAttachments().map((att, index) => (
                      <div key={`existing-${index}`} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20">
                        <div className="flex flex-col min-w-0 flex-1 mr-2">
                          <span className="text-sm font-medium truncate">{att.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {att.size > 0 ? `${(att.size / (1024 * 1024)).toFixed(2)} MB` : 'Uploaded'}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => markExistingAttachmentForRemoval(att.path)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* List of newly added files */}
                {newDownloadFiles.length > 0 && (
                  <div className="space-y-2">
                    {newDownloadFiles.map((file, index) => (
                      <div key={`new-${index}`} className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <div className="flex flex-col min-w-0 flex-1 mr-2">
                          <span className="text-sm font-medium truncate">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB • New
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeNewDownloadFile(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Drop zone with drag & drop support */}
                <div
                  ref={fileDropRef}
                  onDrop={handleFileDrop}
                  onDragOver={handleFileDragOver}
                  onDragLeave={handleFileDragLeave}
                  className={`relative transition-all duration-200 ${
                    isDraggingFiles 
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' 
                      : ''
                  }`}
                >
                  <label className={`flex flex-col items-center justify-center w-full py-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    isDraggingFiles 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border/50 hover:border-primary/50'
                  }`}>
                    {isDraggingFiles ? (
                      <>
                        <FolderOpen className="w-10 h-10 text-primary mb-2 animate-pulse" />
                        <span className="text-sm font-medium text-primary">
                          Drop files or folders here
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">
                          {(getVisibleExistingAttachments().length > 0 || newDownloadFiles.length > 0) ? 'Add more files' : 'Click or drag files/folders here'}
                        </span>
                        <span className="text-xs text-muted-foreground mt-1">
                          ZIP, RAR, 7z, PDF, source files, and more
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      multiple
                      onChange={handleDownloadChange}
                      className="hidden"
                    />
                  </label>
                </div>
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
            disabled={saving || loading || isOverSizeLimit}
            className="flex-1"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save as Draft
          </Button>
          <Button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={saving || loading || isOverSizeLimit}
            className="flex-1 bg-gradient-to-r from-primary to-accent"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {status === "published" ? "Update & Publish" : "Publish"}
          </Button>
        </div>
      </form>
      </div>
    </>
  );
}
