import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { User, Bell, Shield, CreditCard, LogOut, Upload, Loader2, CheckCircle, ExternalLink, RefreshCw, Link2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AvatarCropper } from "@/components/ui/avatar-cropper";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Social platform detection
const detectSocialPlatform = (url: string): { platform: string; icon: React.ReactNode } | null => {
  const lowercaseUrl = url.toLowerCase();
  
  if (lowercaseUrl.includes('instagram.com') || lowercaseUrl.includes('instagr.am')) {
    return {
      platform: 'instagram',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      )
    };
  }
  
  if (lowercaseUrl.includes('youtube.com') || lowercaseUrl.includes('youtu.be')) {
    return {
      platform: 'youtube',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      )
    };
  }
  
  if (lowercaseUrl.includes('twitter.com') || lowercaseUrl.includes('x.com')) {
    return {
      platform: 'twitter',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      )
    };
  }
  
  if (lowercaseUrl.includes('tiktok.com')) {
    return {
      platform: 'tiktok',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
        </svg>
      )
    };
  }
  
  return null;
};

interface SocialLink {
  id: string;
  url: string;
}

export default function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [checkingStripeStatus, setCheckingStripeStatus] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [showAvatarCropper, setShowAvatarCropper] = useState(false);
  const [avatarToCrop, setAvatarToCrop] = useState<string | null>(null);
  
  // Profile
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  
  // Stripe Connect status
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [stripeOnboardingComplete, setStripeOnboardingComplete] = useState(false);
  
  // Social Links
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  
  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [salesNotifications, setSalesNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  // Handle Stripe return URLs
  useEffect(() => {
    const stripeStatus = searchParams.get("stripe");
    if (stripeStatus === "success") {
      toast.success("Stripe account connected! It may take a moment for your status to update.");
      window.history.replaceState({}, "", "/settings");
      // Refresh profile to get updated Stripe status
      if (user) fetchProfile();
    } else if (stripeStatus === "refresh") {
      toast.info("Please complete your Stripe onboarding");
      window.history.replaceState({}, "", "/settings");
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();

      if (error) throw error;

      if (data) {
        setFullName(data.full_name || "");
        setUsername(data.username || "");
        setBio(data.bio || "");
        setWebsite(data.website || "");
        setAvatarUrl(data.avatar_url);
        setBannerUrl((data as Record<string, unknown>).banner_url as string | null);
        setBackgroundUrl((data as Record<string, unknown>).background_url as string | null);
        setStripeAccountId(data.stripe_account_id);
        setStripeOnboardingComplete(data.stripe_onboarding_complete || false);
        
        
        // Load social links
        if (data.social_links && typeof data.social_links === 'object') {
          const links = data.social_links as Record<string, string>;
          const loadedLinks: SocialLink[] = Object.entries(links)
            .filter(([_, url]) => url)
            .map(([_, url]) => ({ id: crypto.randomUUID(), url }));
          setSocialLinks(loadedLinks);
        }
        
        // If there's a Stripe account but onboarding not complete, check status
        if (data.stripe_account_id && !data.stripe_onboarding_complete) {
          checkStripeStatus();
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkStripeStatus = async () => {
    setCheckingStripeStatus(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-connect-status");
      
      if (error) throw error;
      
      if (data?.onboarding_complete) {
        setStripeOnboardingComplete(true);
        toast.success("Stripe account verified and connected!");
      } else if (data?.connected && !data?.onboarding_complete) {
        toast.info("Stripe onboarding is still incomplete. Please complete setup.");
      }
    } catch (error) {
      console.error("Error checking Stripe status:", error);
    } finally {
      setCheckingStripeStatus(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Create a local URL for the cropper
    const imageUrl = URL.createObjectURL(file);
    setAvatarToCrop(imageUrl);
    setShowAvatarCropper(true);
    
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleAvatarCropComplete = async (croppedBlob: Blob) => {
    if (!user) return;

    setUploadingAvatar(true);
    try {
      const path = `avatars/${user.id}/${Date.now()}.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from("product-media")
        .upload(path, croppedBlob, {
          contentType: 'image/jpeg',
        });

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage
        .from("product-media")
        .getPublicUrl(path);

      setAvatarUrl(publicUrl.publicUrl);
      toast.success("Avatar uploaded!");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
      // Clean up the object URL
      if (avatarToCrop) {
        URL.revokeObjectURL(avatarToCrop);
        setAvatarToCrop(null);
      }
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingBanner(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `banners/${user.id}/${Date.now()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from("product-media")
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage
        .from("product-media")
        .getPublicUrl(path);

      setBannerUrl(publicUrl.publicUrl);
      toast.success("Banner uploaded!");
    } catch (error) {
      console.error("Error uploading banner:", error);
      toast.error("Failed to upload banner");
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleBackgroundChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingBackground(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `backgrounds/${user.id}/${Date.now()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from("product-media")
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage
        .from("product-media")
        .getPublicUrl(path);

      setBackgroundUrl(publicUrl.publicUrl);
      toast.success("Background uploaded!");
    } catch (error) {
      console.error("Error uploading background:", error);
      toast.error("Failed to upload background");
    } finally {
      setUploadingBackground(false);
    }
  };

  const removeBackground = () => {
    setBackgroundUrl(null);
    toast.success("Background removed");
  };

  const saveProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      // Check username availability if changed
      if (username) {
        const { data: available } = await supabase
          .rpc("is_username_available", { p_username: username });
        
        const { data: currentProfile } = await supabase
          .from("profiles")
          .select("username")
          .eq("user_id", user.id)
          .single();

        if (!available && currentProfile?.username?.toLowerCase() !== username.toLowerCase()) {
          toast.error("Username is already taken");
          setSaving(false);
          return;
        }
      }

      // Build social_links object from the socialLinks array
      const socialLinksObj: Record<string, string> = {};
      socialLinks.forEach(link => {
        if (link.url.trim()) {
          const detected = detectSocialPlatform(link.url);
          if (detected) {
            socialLinksObj[detected.platform] = link.url.trim();
          }
        }
      });

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          username,
          bio,
          website,
          avatar_url: avatarUrl,
          banner_url: bannerUrl,
          background_url: backgroundUrl,
          social_links: socialLinksObj,
        } as Record<string, unknown>)
        .eq("user_id", user.id);

      if (error) throw error;
      toast.success("Profile saved!");
      // Redirect to profile page
      navigate(`/@${username || 'profile'}`);
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleConnectStripe = async () => {
    setConnectingStripe(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-connect-account");

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
        toast.success("Stripe onboarding opened in a new tab");
      } else {
        throw new Error("No onboarding URL returned");
      }
    } catch (error) {
      console.error("Stripe connect error:", error);
      const message = error instanceof Error ? error.message : "Failed to connect Stripe";
      toast.error(message);
    } finally {
      setConnectingStripe(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
        <p className="text-muted-foreground mb-8">
          Please sign in to access settings.
        </p>
        <Button onClick={() => navigate("/login")}>Sign In</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <Tabs defaultValue="profile" className="space-y-8">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="socials" className="gap-2">
            <Link2 className="w-4 h-4" />
            Socials
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="w-4 h-4" />
            Billing
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your profile information visible to other users.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={avatarUrl || undefined} />
                    <AvatarFallback className="text-2xl">
                      {fullName?.[0] || username?.[0] || user.email?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  {uploadingAvatar && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                <div>
                  <label>
                    <Button variant="outline" asChild className="cursor-pointer" disabled={uploadingAvatar}>
                      <span>
                        {uploadingAvatar ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        {uploadingAvatar ? "Uploading..." : "Change Avatar"}
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                      disabled={uploadingAvatar}
                    />
                  </label>
                  <p className="text-sm text-muted-foreground mt-2">
                    JPG, PNG or GIF. Max 2MB.
                  </p>
                </div>
              </div>

              {/* Banner Upload */}
              <div>
                <Label className="mb-2 block">Profile Banner</Label>
                <div className="relative rounded-lg overflow-hidden border border-border">
                  {bannerUrl ? (
                    <img
                      src={bannerUrl}
                      alt="Profile banner"
                      className="w-full h-24 object-cover"
                    />
                  ) : (
                    <div className="w-full h-24 bg-gradient-to-br from-primary/40 to-accent/30" />
                  )}
                  {uploadingBanner ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                      <div className="flex items-center gap-2 text-primary">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Uploading...</span>
                      </div>
                    </div>
                  ) : (
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                      <span className="text-white text-sm flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Change Banner
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Recommended: 1500x500px. JPG, PNG or GIF.
                </p>
              </div>

              {/* Profile Background (Steam-style) */}
              <div>
                <Label className="mb-2 block">Profile Background</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Add a full-page background image to your profile (like Steam profiles)
                </p>
                <div className="relative rounded-lg overflow-hidden border border-border">
                  {backgroundUrl ? (
                    <div className="relative">
                      <img
                        src={backgroundUrl}
                        alt="Profile background"
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute inset-0 bg-background/60" />
                    </div>
                  ) : (
                    <div className="w-full h-32 bg-muted flex items-center justify-center">
                      <span className="text-muted-foreground text-sm">No background set</span>
                    </div>
                  )}
                  {uploadingBackground ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                      <div className="flex items-center gap-2 text-primary">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Uploading...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity bg-black/40">
                      <label className="cursor-pointer">
                        <span className="text-white text-sm flex items-center gap-2 bg-primary/80 hover:bg-primary px-3 py-1.5 rounded-md">
                          <Upload className="w-4 h-4" />
                          {backgroundUrl ? "Change" : "Upload"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBackgroundChange}
                          className="hidden"
                        />
                      </label>
                      {backgroundUrl && (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={removeBackground}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Recommended: 1920x1080px or larger. JPG, PNG. This will appear behind your entire profile.
                </p>
              </div>


              <Separator />

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="username">Username</Label>
                  <div className="flex mt-2">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                      @
                    </span>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                      placeholder="johndoe"
                      className="rounded-l-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Email</Label>
                <Input
                  value={user.email || ""}
                  disabled
                  className="mt-2 bg-muted"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Contact support to change your email address.
                </p>
              </div>

              <Button onClick={saveProfile} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Manage how you receive notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Receive email notifications for important updates
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Sales Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified when someone purchases your product
                  </p>
                </div>
                <Switch
                  checked={salesNotifications}
                  onCheckedChange={setSalesNotifications}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Marketing Emails</p>
                  <p className="text-sm text-muted-foreground">
                    Receive updates about new features and promotions
                  </p>
                </div>
                <Switch
                  checked={marketingEmails}
                  onCheckedChange={setMarketingEmails}
                />
              </div>

              <Button>Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your account security and sessions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Change Password</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Update your password to keep your account secure.
                </p>
                <Button variant="outline">Change Password</Button>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-2">Two-Factor Authentication</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add an extra layer of security to your account.
                </p>
                <Button variant="outline">Enable 2FA</Button>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-2 text-destructive">Danger Zone</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Permanently delete your account and all associated data.
                </p>
                <Button variant="destructive">Delete Account</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle>Billing & Payments</CardTitle>
              <CardDescription>
                Manage your Stripe account to receive payments for your products.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stripe Connect Status */}
              <div className={`p-6 rounded-lg border ${stripeOnboardingComplete ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-gradient-to-br from-primary/20 to-accent/20 border-primary/30'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">Stripe Connect</h3>
                      {stripeOnboardingComplete ? (
                        <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Connected
                        </Badge>
                      ) : stripeAccountId ? (
                        <Badge variant="secondary" className="bg-amber-500/20 text-amber-400">
                          Pending
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {stripeOnboardingComplete 
                        ? "Your Stripe account is connected. You can receive payments for your products."
                        : stripeAccountId
                        ? "Your Stripe account setup is incomplete. Please complete onboarding to receive payments."
                        : "Connect your Stripe account to receive payments for your products. We take a 5% platform fee on each sale."
                      }
                    </p>
                  </div>
                </div>
                
                {stripeOnboardingComplete ? (
                  <Button variant="outline" onClick={handleConnectStripe} disabled={connectingStripe}>
                    {connectingStripe ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <ExternalLink className="w-4 h-4 mr-2" />
                    )}
                    Manage Stripe Account
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button 
                      className="bg-gradient-to-r from-primary to-accent"
                      onClick={handleConnectStripe}
                      disabled={connectingStripe}
                    >
                      {connectingStripe ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : stripeAccountId ? (
                        "Complete Onboarding"
                      ) : (
                        "Connect Stripe Account"
                      )}
                    </Button>
                    {stripeAccountId && (
                      <Button 
                        variant="outline"
                        onClick={checkStripeStatus}
                        disabled={checkingStripeStatus}
                      >
                        {checkingStripeStatus ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-4">Transaction History</h3>
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No transactions yet</p>
                  <p className="text-sm mt-2">Your sales will appear here once you start selling.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Socials Tab */}
        <TabsContent value="socials">
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle>Social Links</CardTitle>
              <CardDescription>
                Add your social media links. We'll automatically detect the platform and show the icon on your profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {socialLinks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No social links added yet. Click below to add one.</p>
              ) : (
                <div className="space-y-3">
                  {socialLinks.map((link) => {
                    const detected = detectSocialPlatform(link.url);
                    return (
                      <div key={link.id} className="flex items-center gap-3">
                        {/* Platform icon or generic link icon */}
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                          {detected ? detected.icon : <Link2 className="w-5 h-5" />}
                        </div>
                        
                        {/* URL input */}
                        <Input
                          value={link.url}
                          onChange={(e) => {
                            setSocialLinks(prev => 
                              prev.map(l => l.id === link.id ? { ...l, url: e.target.value } : l)
                            );
                          }}
                          placeholder="Paste your social media URL..."
                          className="flex-1"
                        />
                        
                        {/* Remove button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            setSocialLinks(prev => prev.filter(l => l.id !== link.id));
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add new row button */}
              <button
                onClick={() => {
                  setSocialLinks(prev => [...prev, { id: crypto.randomUUID(), url: '' }]);
                }}
                className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add social link
              </button>

              <Separator className="my-4" />

              <p className="text-xs text-muted-foreground">
                Supported platforms: Instagram, YouTube, X (Twitter), TikTok
              </p>

              <Button onClick={saveProfile} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sign Out */}
      <Card className="bg-card/50 mt-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sign Out</p>
              <p className="text-sm text-muted-foreground">
                Sign out of your account on this device.
              </p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Avatar Cropper Dialog */}
      {avatarToCrop && (
        <AvatarCropper
          open={showAvatarCropper}
          onOpenChange={(open) => {
            setShowAvatarCropper(open);
            if (!open && avatarToCrop) {
              URL.revokeObjectURL(avatarToCrop);
              setAvatarToCrop(null);
            }
          }}
          imageSrc={avatarToCrop}
          onCropComplete={handleAvatarCropComplete}
        />
      )}
    </div>
  );
}
