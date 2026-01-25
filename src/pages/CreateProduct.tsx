import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, X, Loader2, Sparkles, Check, Crown, FolderOpen } from "lucide-react";
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
import SubscriptionPlanPicker from "@/components/product/SubscriptionPlanPicker";
import VideoTrimmer from "@/components/product/VideoTrimmer";

// Premium Publishing Overlay Component
const PublishingOverlay = ({ isPublishing }: { isPublishing: boolean }) => {
  const [step, setStep] = useState(0);
  const steps = [
    "Uploading media...",
    "Processing files...",
    "Creating product...",
    "Almost there..."
  ];

  useEffect(() => {
    if (!isPublishing) {
      setStep(0);
      return;
    }
    
    const interval = setInterval(() => {
      setStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1500);
    
    return () => clearInterval(interval);
  }, [isPublishing]);

  if (!isPublishing) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
      
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        {/* Animated icon */}
        <div className="relative mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-pulse">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          {/* Rotating ring */}
          <div className="absolute inset-0 w-20 h-20 border-2 border-primary/30 border-t-primary rounded-full animate-spin" style={{ animationDuration: '1.5s' }} />
        </div>
        
        {/* Title */}
        <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Publishing Your Product
        </h2>
        
        {/* Current step */}
        <p className="text-muted-foreground mb-8 h-6 animate-fade-in" key={step}>
          {steps[step]}
        </p>
        
        {/* Progress steps */}
        <div className="flex items-center gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i <= step 
                  ? 'w-8 bg-gradient-to-r from-primary to-accent' 
                  : 'w-4 bg-muted'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

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

// Helper to extract YouTube video ID from various URL formats
const extractYoutubeId = (url: string): string | null => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
};

export default function CreateProduct() {
  const { user, profile, profileLoading } = useAuth();
  const navigate = useNavigate();
  
  // Derive seller status from centralized auth
  const isSeller = profile?.is_seller || false;
  
  const [loading, setLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
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
  const [videoTrimStart, setVideoTrimStart] = useState<number>(0);
  const [videoTrimEnd, setVideoTrimEnd] = useState<number>(5);
  const [showTrimmer, setShowTrimmer] = useState(false);
  const [downloadFiles, setDownloadFiles] = useState<File[]>([]);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const fileDropRef = useRef<HTMLDivElement>(null);
  
  // Subscription plan picker state
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [selectedSubscriptionPlans, setSelectedSubscriptionPlans] = useState<{
    planId: string;
    planName: string;
    planPriceCents: number;
    isFree: boolean;
    discountPercent: number | null;
  }[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);
  
  // Fetch profile ID on mount for plan picker
  useEffect(() => {
    const fetchProfileId = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();
      setProfileId(data?.id || null);
    };
    fetchProfileId();
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
    const files = e.target.files;
    if (files && files.length > 0) {
      setDownloadFiles(prev => [...prev, ...Array.from(files)]);
    }
    // Reset input value so the same file can be added again if needed
    e.target.value = '';
  };

  const removeDownloadFile = (index: number) => {
    setDownloadFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Recursively get all files from dropped items (including folders)
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
          reader.readEntries(async (entries) => {
            for (const e of entries) {
              await traverseDirectory(e);
            }
            resolve();
          });
        });
      }
    };

    const promises: Promise<void>[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          promises.push(traverseDirectory(entry));
        }
      }
    }
    await Promise.all(promises);
    return files;
  };

  // Handle drag and drop for files
  const handleFileDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFiles(true);
  }, []);

  const handleFileDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set false if leaving the drop zone entirely
    if (!fileDropRef.current?.contains(e.relatedTarget as Node)) {
      setIsDraggingFiles(false);
    }
  }, []);

  const handleFileDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFiles(false);

    const items = e.dataTransfer.items;
    if (items && items.length > 0) {
      const droppedFiles = await getFilesFromDataTransferItems(items);
      if (droppedFiles.length > 0) {
        setDownloadFiles(prev => [...prev, ...droppedFiles]);
      }
    }
  }, []);

  // Handle video trim confirmation
  const handleTrimConfirm = (start: number, end: number) => {
    setVideoTrimStart(start);
    setVideoTrimEnd(end);
    setShowTrimmer(false);
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

    // Validate minimum price for paid products
    if ((pricingType === "paid" || pricingType === "both") && parseFloat(price) < 4.99) {
      toast.error("Minimum price is $4.99 for paid products");
      return;
    }

    setLoading(true);
    if (publish) setIsPublishing(true);

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

      // Upload multiple download files to private bucket
      let downloadUrl: string | null = null;
      let originalFilename: string | null = null;
      const attachments: { name: string; path: string; size: number }[] = [];
      
      if (downloadFiles.length > 0) {
        for (const file of downloadFiles) {
          // Store in private bucket with user's ID as folder for RLS policy
          const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._()-]/g, '_')}`;
          const { error: uploadError } = await supabase.storage
            .from("product-files")
            .upload(path, file);

          if (uploadError) {
            console.error('Download file upload error:', uploadError);
            throw uploadError;
          }

          attachments.push({
            name: file.name,
            path: path,
            size: file.size,
          });
        }
        
        // For backward compatibility, set download_url and original_filename to first file
        if (attachments.length > 0) {
          downloadUrl = attachments[0].path;
          originalFilename = attachments[0].name;
        }
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
          original_filename: originalFilename,
          attachments: attachments.length > 0 ? attachments : null,
          creator_id: profile.id,
          status: publish ? "published" : "draft",
          subscription_access: subscriptionAccess,
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Link product to subscription plans if selected
      if (product && selectedSubscriptionPlans.length > 0) {
        const planProductsToInsert = selectedSubscriptionPlans.map(plan => ({
          plan_id: plan.planId,
          product_id: product.id,
          is_free: plan.isFree,
          discount_percent: plan.isFree ? null : plan.discountPercent,
          discount_type: plan.isFree ? 'free' : plan.discountPercent ? 'percentage' : null,
        }));

        const { error: linkError } = await supabase
          .from('subscription_plan_products')
          .insert(planProductsToInsert);

        if (linkError) {
          console.error('Error linking to subscription plans:', linkError);
          // Don't fail the whole operation, just log
        }
      }

      // If publishing, notify all followers
      if (publish && product) {
        try {
          await supabase.functions.invoke('notify-product-launch', {
            body: {
              productId: product.id,
              creatorProfileId: profile.id,
            }
          });
        } catch (notifyError) {
          console.error('Failed to send launch notifications:', notifyError);
          // Don't block the user - product was created successfully
        }
      }

      toast.success(publish ? "Product published!" : "Draft saved!");
      navigate(product.slug ? `/p/${product.slug}` : `/product/${product.id}`);
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error("Failed to create product");
    } finally {
      setLoading(false);
      setIsPublishing(false);
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

  if (profileLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!isSeller) {
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

  const youtubeVideoId = extractYoutubeId(youtubeUrl);

  return (
    <>
      <PublishingOverlay isPublishing={isPublishing} />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">Create New Product</h1>

      <form className="space-y-8">
        {/* YouTube Video - Top Section */}
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle>YouTube Video</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="youtube">YouTube Video URL (Optional)</Label>
              <Input
                id="youtube"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Paste a YouTube link to showcase your product with a video
              </p>
            </div>
            
            {/* Live YouTube Preview */}
            {youtubeVideoId && (
              <div className="mt-4">
                <Label className="text-sm text-muted-foreground mb-2 block">Preview</Label>
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black/20">
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                    title="YouTube video preview"
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
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
                    <>Preview: <span className="font-mono text-primary">editorsparadise.org/p/{slug}</span></>
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
                  onClick={() => {
                    setPricingType("free");
                    setSelectedSubscriptionPlans([]);
                  }}
                >
                  Free
                </Button>
                <Button
                  type="button"
                  variant={pricingType === "paid" ? "default" : "outline"}
                  onClick={() => {
                    setPricingType("paid");
                    setSelectedSubscriptionPlans([]);
                  }}
                >
                  One-Time Purchase
                </Button>
                <Button
                  type="button"
                  variant={pricingType === "subscription" ? "default" : "outline"}
                  onClick={() => {
                    setPricingType("subscription");
                    if (profileId) setShowPlanPicker(true);
                  }}
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Subscription Only
                </Button>
                <Button
                  type="button"
                  variant={pricingType === "both" ? "default" : "outline"}
                  onClick={() => {
                    setPricingType("both");
                    if (profileId) setShowPlanPicker(true);
                  }}
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Both (One-Time + Subscription)
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {pricingType === "subscription" && "Only users subscribed to one of your plans can access this product."}
                {pricingType === "both" && "Users can buy once OR get access through their subscription."}
              </p>
            </div>

            {/* Selected Subscription Plans Display */}
            {(pricingType === "subscription" || pricingType === "both") && selectedSubscriptionPlans.length > 0 && (
              <div className="p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between mb-3">
                  <Label className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-primary" />
                    Linked Subscription Plans
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPlanPicker(true)}
                  >
                    Edit
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedSubscriptionPlans.map((plan) => (
                    <Badge 
                      key={plan.planId} 
                      variant="secondary"
                      className="flex items-center gap-1.5 py-1.5"
                    >
                      <span>{plan.planName}</span>
                      <span className="text-muted-foreground">•</span>
                      <span className={plan.isFree ? "text-emerald-500" : "text-violet-500"}>
                        {plan.isFree ? "Free" : `${plan.discountPercent}% off`}
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Prompt to select plans if subscription type but no plans selected */}
            {(pricingType === "subscription" || pricingType === "both") && selectedSubscriptionPlans.length === 0 && (
              <div className="p-4 rounded-lg border border-dashed border-primary/50 bg-primary/5 text-center">
                <Crown className="w-8 h-8 mx-auto text-primary mb-2" />
                <p className="text-sm text-muted-foreground mb-3">
                  Select which subscription plans will include this product
                </p>
                <Button type="button" variant="outline" onClick={() => setShowPlanPicker(true)}>
                  Select Plans
                </Button>
              </div>
            )}

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

        {/* Subscription Plan Picker Dialog */}
        {profileId && (
          <SubscriptionPlanPicker
            open={showPlanPicker}
            onOpenChange={setShowPlanPicker}
            creatorId={profileId}
            pricingType={pricingType === "subscription" ? "subscription" : "both"}
            onConfirm={(plans) => setSelectedSubscriptionPlans(plans)}
          />
        )}

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
                Short video clip that plays when hovering over your product card. Select a 1-5 second clip.
              </p>
              <div className="mt-2">
                {previewVideoPreview ? (
                  <div className="space-y-4">
                    {showTrimmer ? (
                      <VideoTrimmer
                        videoSrc={previewVideoPreview}
                        onTrimConfirm={handleTrimConfirm}
                        minDuration={1}
                        maxDuration={5}
                      />
                    ) : (
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
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    
                    {/* Trim controls */}
                    {!showTrimmer && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/20">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Preview clip: </span>
                          <span className="font-mono font-medium">
                            {videoTrimStart.toFixed(1)}s - {videoTrimEnd.toFixed(1)}s
                          </span>
                          <span className="text-muted-foreground ml-2">
                            ({(videoTrimEnd - videoTrimStart).toFixed(1)}s)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowTrimmer(true)}
                        >
                          Edit Clip
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full py-8 border-2 border-dashed border-border/50 rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">
                      Click to upload preview video
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      MP4, WebM - you'll select a 1-5 second clip
                    </span>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        handlePreviewVideoChange(e);
                        setShowTrimmer(true);
                      }}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>


            {/* Product Files - Multiple with Drag & Drop */}
            <div>
              <Label>Product Files</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Drag & drop files or folders, or click to browse. ZIP, RAR, 7z, source files, etc.
              </p>
              <div className="mt-2 space-y-2">
                {/* List of added files */}
                {downloadFiles.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {downloadFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20">
                        <div className="flex flex-col min-w-0 flex-1 mr-2">
                          <span className="text-sm font-medium truncate">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeDownloadFile(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Drag & Drop zone */}
                <div
                  ref={fileDropRef}
                  onDragOver={handleFileDragOver}
                  onDragLeave={handleFileDragLeave}
                  onDrop={handleFileDrop}
                  className={`relative flex flex-col items-center justify-center w-full py-8 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                    isDraggingFiles
                      ? 'border-primary bg-primary/10 scale-[1.02]'
                      : 'border-border/50 hover:border-primary/50'
                  }`}
                >
                  <label className="flex flex-col items-center justify-center w-full cursor-pointer">
                    {isDraggingFiles ? (
                      <>
                        <FolderOpen className="w-10 h-10 text-primary mb-2 animate-bounce" />
                        <span className="text-sm font-medium text-primary">
                          Drop files or folders here
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">
                          {downloadFiles.length > 0 ? 'Add more files' : 'Drag & drop files or folders here'}
                        </span>
                        <span className="text-xs text-muted-foreground mt-1">
                          or click to browse • ZIP, RAR, 7z, PDF, and more
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
    </>
  );
}
