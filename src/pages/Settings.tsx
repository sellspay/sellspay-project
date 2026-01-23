import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { User, Bell, Shield, CreditCard, LogOut, Upload, Loader2, CheckCircle, ExternalLink } from "lucide-react";
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
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connectingStripe, setConnectingStripe] = useState(false);
  
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
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      const ext = file.name.split(".").pop();
      const path = `avatars/${user.id}/${Date.now()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from("product-media")
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage
        .from("product-media")
        .getPublicUrl(path);

      setAvatarUrl(publicUrl.publicUrl);
      toast.success("Avatar uploaded!");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload avatar");
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

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
    }
  };

  const handleBackgroundChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

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
        } as Record<string, unknown>)
        .eq("user_id", user.id);

      if (error) throw error;
      toast.success("Profile saved!");
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
        window.location.href = data.url;
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            Profile
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
                <Avatar className="w-20 h-20">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="text-2xl">
                    {fullName?.[0] || username?.[0] || user.email?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <label>
                    <Button variant="outline" asChild className="cursor-pointer">
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        Change Avatar
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
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
    </div>
  );
}
