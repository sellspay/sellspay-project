import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Bell, Shield, CreditCard, LogOut, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Profile
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [salesNotifications, setSalesNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

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
        })
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
                Manage your payment methods and view transaction history.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30">
                <h3 className="font-medium mb-2">Connect with Stripe</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect your Stripe account to receive payments for your products.
                </p>
                <Button className="bg-gradient-to-r from-primary to-accent">
                  Connect Stripe Account
                </Button>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-4">Transaction History</h3>
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No transactions yet</p>
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
