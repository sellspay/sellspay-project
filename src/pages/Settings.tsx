import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { User, Bell, Shield, CreditCard, LogOut, Upload, Loader2, CheckCircle, ExternalLink, RefreshCw, Link2, Plus, X, AlertTriangle, Mail } from "lucide-react";
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
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { SellerEmailSettings } from "@/components/settings/SellerEmailSettings";
import { PayoutMethodSelector } from "@/components/settings/PayoutMethodSelector";

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
  const { user, signOut, resetPassword } = useAuth();
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
  const [creatorLaunchEmails, setCreatorLaunchEmails] = useState(true);
  const [salesNotifications, setSalesNotifications] = useState(true);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);
  
  // Account Type
  const [isSeller, setIsSeller] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  
  // Security
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [sendingPasswordReset, setSendingPasswordReset] = useState(false);
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [switchingAccountType, setSwitchingAccountType] = useState(false);
  
  // Email change
  const [showEmailChangeDialog, setShowEmailChangeDialog] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailOtpCode, setEmailOtpCode] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [verifyingEmailChange, setVerifyingEmailChange] = useState(false);
  
  // Username change tracking
  const [originalUsername, setOriginalUsername] = useState("");
  const [lastUsernameChangedAt, setLastUsernameChangedAt] = useState<string | null>(null);
  const [previousUsername, setPreviousUsername] = useState<string | null>(null);
  const [previousUsernameAvailableAt, setPreviousUsernameAvailableAt] = useState<string | null>(null);

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
        setOriginalUsername(data.username || "");
        setBio(data.bio || "");
        setWebsite(data.website || "");
        setAvatarUrl(data.avatar_url);
        setBannerUrl((data as Record<string, unknown>).banner_url as string | null);
        setBackgroundUrl((data as Record<string, unknown>).background_url as string | null);
        setIsSeller((data as Record<string, unknown>).is_seller as boolean || false);
        setProfileId(data.id);
        setMfaEnabled(data.mfa_enabled || false);
        setCreatorLaunchEmails(data.email_notifications_enabled !== false);
        
        // Username change tracking
        setLastUsernameChangedAt((data as Record<string, unknown>).last_username_changed_at as string | null);
        setPreviousUsername((data as Record<string, unknown>).previous_username as string | null);
        setPreviousUsernameAvailableAt((data as Record<string, unknown>).previous_username_available_at as string | null);
        
        // Load social links
        if (data.social_links && typeof data.social_links === 'object') {
          const links = data.social_links as Record<string, string>;
          const loadedLinks: SocialLink[] = Object.entries(links)
            .filter(([_, url]) => url)
            .map(([_, url]) => ({ id: crypto.randomUUID(), url }));
          setSocialLinks(loadedLinks);
        }
      }
      
      // Fetch seller config from edge function (for Stripe status)
      if ((data as Record<string, unknown>)?.is_seller) {
        await fetchSellerConfig();
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSellerConfig = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-connect-status");
      
      if (error) throw error;
      
      if (data) {
        setStripeAccountId(data.connected ? "connected" : null);
        setStripeOnboardingComplete(data.onboarding_complete || false);
      }
    } catch (error) {
      console.error("Error fetching seller config:", error);
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

  const handleSwitchToBuyer = async () => {
    if (!profileId) return;
    setSwitchingAccountType(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_seller: false })
        .eq('id', profileId);
      
      if (error) throw error;
      
      setIsSeller(false);
      toast.success('Your account is now a buyer account.');
    } catch (error) {
      console.error('Error switching to buyer:', error);
      toast.error('Failed to switch account type.');
    } finally {
      setSwitchingAccountType(false);
    }
  };

  const handleSwitchToSeller = async () => {
    if (!profileId) return;
    setSwitchingAccountType(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_seller: true })
        .eq('id', profileId);
      
      if (error) throw error;
      
      setIsSeller(true);
      toast.success('Your account is now a seller account. You can create products!');
    } catch (error) {
      console.error('Error switching to seller:', error);
      toast.error('Failed to switch account type.');
    } finally {
      setSwitchingAccountType(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;
    
    setSendingPasswordReset(true);
    try {
      const { error } = await resetPassword(user.email);
      if (error) throw error;
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error) {
      console.error('Error sending password reset:', error);
      toast.error('Failed to send password reset email.');
    } finally {
      setSendingPasswordReset(false);
    }
  };

  const handleToggle2FA = async () => {
    if (mfaEnabled) {
      // Disable 2FA
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ mfa_enabled: false })
          .eq('id', profileId);
        
        if (error) throw error;
        
        setMfaEnabled(false);
        toast.success('Two-factor authentication disabled.');
      } catch (error) {
        console.error('Error disabling 2FA:', error);
        toast.error('Failed to disable 2FA.');
      }
    } else {
      // Start 2FA enable flow - send OTP first
      setShow2FADialog(true);
      setOtpSent(false);
      setOtpCode("");
    }
  };

  const handleSendOtpFor2FA = async () => {
    if (!user?.email || !user?.id) return;
    
    setSendingOtp(true);
    try {
      const { error } = await supabase.functions.invoke("send-verification-otp", {
        body: { email: user.email, userId: user.id }
      });
      
      if (error) throw error;
      
      setOtpSent(true);
      toast.success('Verification code sent to your email.');
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast.error('Failed to send verification code.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!user?.id || !otpCode || otpCode.length !== 6) return;
    
    setVerifyingOtp(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: { userId: user.id, code: otpCode }
      });
      
      if (error) throw new Error(error.message || 'Failed to verify code');
      if (!data?.success) {
        throw new Error(data?.error || 'Invalid verification code');
      }
      
      // The edge function already updates mfa_enabled, just update local state
      setMfaEnabled(true);
      setShow2FADialog(false);
      setOtpCode("");
      setOtpSent(false);
      toast.success('Two-factor authentication enabled!');
    } catch (error) {
      console.error('Error verifying OTP:', error);
      const message = error instanceof Error ? error.message : 'Failed to verify code.';
      toast.error(message);
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Email change handlers
  const handleStartEmailChange = () => {
    setNewEmail("");
    setEmailOtpCode("");
    setEmailOtpSent(false);
    setShowEmailChangeDialog(true);
  };

  const handleSendEmailChangeOtp = async () => {
    if (!user?.email || !user?.id) return;
    
    // Validate new email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newEmail || !emailRegex.test(newEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    if (newEmail.toLowerCase() === user.email.toLowerCase()) {
      toast.error('New email must be different from current email');
      return;
    }
    
    setSendingEmailOtp(true);
    try {
      // Send OTP to ORIGINAL email for verification
      const { error } = await supabase.functions.invoke("send-verification-otp", {
        body: { email: user.email, userId: user.id }
      });
      
      if (error) throw error;
      
      setEmailOtpSent(true);
      toast.success('Verification code sent to your current email.');
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast.error('Failed to send verification code.');
    } finally {
      setSendingEmailOtp(false);
    }
  };

  const handleVerifyEmailChange = async () => {
    if (!user?.id || !emailOtpCode || emailOtpCode.length !== 6 || !newEmail) return;
    
    setVerifyingEmailChange(true);
    try {
      // Verify OTP
      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: { userId: user.id, code: emailOtpCode, purpose: 'login' }
      });
      
      if (error) throw new Error(error.message || 'Verification failed');
      if (!data?.success) {
        throw new Error(data?.error || 'Invalid verification code');
      }
      
      // Update email in Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        email: newEmail
      });
      
      if (updateError) throw updateError;
      
      toast.success('Email updated! Please check your new email for a confirmation link.');
      setShowEmailChangeDialog(false);
      setNewEmail("");
      setEmailOtpCode("");
      setEmailOtpSent(false);
    } catch (error) {
      console.error('Error changing email:', error);
      const message = error instanceof Error ? error.message : 'Failed to change email.';
      toast.error(message);
    } finally {
      setVerifyingEmailChange(false);
    }
  };

  // Username change helpers
  const canChangeUsername = (): { allowed: boolean; reason?: string; daysRemaining?: number } => {
    if (!lastUsernameChangedAt) return { allowed: true };
    
    const lastChanged = new Date(lastUsernameChangedAt);
    const now = new Date();
    const daysSinceChange = Math.floor((now.getTime() - lastChanged.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = 60 - daysSinceChange;
    
    if (daysRemaining > 0) {
      return { 
        allowed: false, 
        reason: `You can change your username again in ${daysRemaining} days`,
        daysRemaining 
      };
    }
    
    return { allowed: true };
  };

  const canRevertToPreviousUsername = (): boolean => {
    if (!previousUsername || !previousUsernameAvailableAt) return false;
    return new Date() < new Date(previousUsernameAvailableAt);
  };

  const handleRevertUsername = async () => {
    if (!previousUsername || !user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          username: previousUsername,
          previous_username: null,
          previous_username_available_at: null,
          // Don't update last_username_changed_at when reverting
        } as Record<string, unknown>)
        .eq("user_id", user.id);
      
      if (error) throw error;
      
      setUsername(previousUsername);
      setOriginalUsername(previousUsername);
      setPreviousUsername(null);
      setPreviousUsernameAvailableAt(null);
      toast.success('Username reverted successfully!');
    } catch (error) {
      console.error('Error reverting username:', error);
      toast.error('Failed to revert username');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    setDeletingAccount(true);
    try {
      // Delete profile (cascades to related data)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', user.id);
      
      if (profileError) throw profileError;
      
      // Sign out
      await signOut();
      toast.success('Your account has been deleted.');
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account. Please contact support.');
    } finally {
      setDeletingAccount(false);
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

  const removeAvatar = () => {
    setAvatarUrl(null);
    toast.success("Avatar removed");
  };

  const removeBanner = () => {
    setBannerUrl(null);
    toast.success("Banner removed");
  };

  const saveProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const usernameChanged = username.toLowerCase() !== originalUsername.toLowerCase();
      
      // Check if username is being changed
      if (usernameChanged) {
        // Check 60-day restriction
        const usernameCheck = canChangeUsername();
        if (!usernameCheck.allowed) {
          toast.error(usernameCheck.reason || 'Cannot change username yet');
          setSaving(false);
          return;
        }
        
        // Check username availability using the new v2 function that checks reserved names
        const { data: available } = await supabase
          .rpc("is_username_available_v2", { p_username: username });
        
        if (!available) {
          toast.error("Username is already taken or reserved");
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

      // Build update object
      const updateData: Record<string, unknown> = {
        full_name: fullName,
        username,
        bio,
        website,
        avatar_url: avatarUrl,
        banner_url: bannerUrl,
        background_url: backgroundUrl,
        social_links: socialLinksObj,
      };
      
      // If username changed, update tracking fields
      if (usernameChanged && originalUsername) {
        updateData.last_username_changed_at = new Date().toISOString();
        updateData.previous_username = originalUsername;
        // 14 days from now
        const availableAt = new Date();
        availableAt.setDate(availableAt.getDate() + 14);
        updateData.previous_username_available_at = availableAt.toISOString();
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("user_id", user.id);

      if (error) throw error;
      
      if (usernameChanged) {
        setLastUsernameChangedAt(new Date().toISOString());
        setPreviousUsername(originalUsername);
        const availableAt = new Date();
        availableAt.setDate(availableAt.getDate() + 14);
        setPreviousUsernameAvailableAt(availableAt.toISOString());
        setOriginalUsername(username);
        toast.success("Profile saved! Your old username will be reserved for 14 days.");
      } else {
        toast.success("Profile saved!");
      }
      
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
        <TabsList className="grid w-full grid-cols-6">
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
          <TabsTrigger value="seller-email" className="gap-2">
            <Mail className="w-4 h-4" />
            Email
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
                <div className="flex flex-col gap-2">
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
                  {avatarUrl && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={removeAvatar}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  )}
                  <p className="text-sm text-muted-foreground">
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
                    <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity bg-black/40">
                      <label className="cursor-pointer">
                        <span className="text-white text-sm flex items-center gap-2 bg-primary/80 hover:bg-primary px-3 py-1.5 rounded-md">
                          <Upload className="w-4 h-4" />
                          {bannerUrl ? "Change" : "Upload"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBannerChange}
                          className="hidden"
                        />
                      </label>
                      {bannerUrl && (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={removeBanner}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Recommended: 1920x1080px (16:9 aspect ratio). JPG, PNG or GIF.
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
                      disabled={!canChangeUsername().allowed}
                    />
                  </div>
                  {!canChangeUsername().allowed && (
                    <p className="text-sm text-amber-500 mt-2">
                      {canChangeUsername().reason}
                    </p>
                  )}
                  {canRevertToPreviousUsername() && previousUsername && (
                    <div className="mt-2 p-3 rounded-lg border border-border bg-muted/30">
                      <p className="text-sm text-muted-foreground mb-2">
                        Your previous username <span className="font-medium text-foreground">@{previousUsername}</span> is reserved until {new Date(previousUsernameAvailableAt!).toLocaleDateString()}.
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleRevertUsername}
                        disabled={saving}
                      >
                        Revert to @{previousUsername}
                      </Button>
                    </div>
                  )}
                  {lastUsernameChangedAt && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Usernames can only be changed once every 60 days.
                    </p>
                  )}
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
                <div className="flex items-center gap-3 mt-2">
                  <Input
                    value={user.email || ""}
                    disabled
                    className="bg-muted flex-1"
                  />
                  <Button variant="outline" onClick={handleStartEmailChange}>
                    Change Email
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  A verification code will be sent to your current email address.
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
                  <p className="font-medium">Creator Launch Emails</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified via email when creators you follow launch new products
                  </p>
                </div>
                <Switch
                  checked={creatorLaunchEmails}
                  onCheckedChange={async (checked) => {
                    setCreatorLaunchEmails(checked);
                    setSavingNotifications(true);
                    try {
                      const { error } = await supabase
                        .from('profiles')
                        .update({ email_notifications_enabled: checked })
                        .eq('id', profileId);
                      if (error) throw error;
                      toast.success(checked ? 'Creator launch emails enabled' : 'Creator launch emails disabled');
                    } catch (error) {
                      console.error('Error updating notification preferences:', error);
                      toast.error('Failed to update preferences');
                      setCreatorLaunchEmails(!checked);
                    } finally {
                      setSavingNotifications(false);
                    }
                  }}
                  disabled={savingNotifications}
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
                  We'll send a password reset link to your email address.
                </p>
                <Button 
                  variant="outline" 
                  onClick={handleChangePassword}
                  disabled={sendingPasswordReset}
                >
                  {sendingPasswordReset && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {sendingPasswordReset ? 'Sending...' : 'Change Password'}
                </Button>
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Two-Factor Authentication</h3>
                  {mfaEnabled && (
                    <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Enabled
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {mfaEnabled 
                    ? 'Your account is protected with two-factor authentication.'
                    : 'Add an extra layer of security to your account.'}
                </p>
                <Button 
                  variant={mfaEnabled ? "outline" : "default"} 
                  onClick={handleToggle2FA}
                >
                  {mfaEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                </Button>
              </div>

              <Separator />

              {/* Account Type Section */}
              <div>
                <h3 className="font-medium mb-2">Account Type</h3>
                <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
                  <div className="flex-1">
                    <p className="font-medium">
                      {isSeller ? 'Seller Account' : 'Buyer Account'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isSeller 
                        ? 'You can create and sell products on the platform.'
                        : 'You can purchase and save products.'}
                    </p>
                  </div>
                  {isSeller ? (
                    <Button 
                      variant="outline" 
                      onClick={handleSwitchToBuyer}
                      disabled={switchingAccountType}
                    >
                      {switchingAccountType ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Switching...</>
                      ) : (
                        'Switch to Buyer'
                      )}
                    </Button>
                  ) : (
                    <Button 
                      variant="default" 
                      onClick={handleSwitchToSeller}
                      disabled={switchingAccountType}
                    >
                      {switchingAccountType ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Switching...</>
                      ) : (
                        'Become a Seller'
                      )}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {isSeller 
                    ? 'Switching to a buyer account will hide your store tab. Your products will remain but won\'t be visible until you switch back.'
                    : 'Becoming a seller lets you create and sell products on the platform.'}
                </p>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-2 text-destructive flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Danger Zone
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Delete Account</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your
                        account and remove all your data including products, purchases,
                        and profile information from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteAccount}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={deletingAccount}
                      >
                        {deletingAccount ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</>
                        ) : (
                          'Delete Account'
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          {/* 2FA Dialog */}
          <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
                <DialogDescription>
                  {otpSent 
                    ? 'Enter the 6-digit code sent to your email to enable 2FA.'
                    : 'We\'ll send a verification code to your email to confirm your identity.'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {!otpSent ? (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                      A verification code will be sent to: <span className="font-medium text-foreground">{user?.email}</span>
                    </p>
                    <Button onClick={handleSendOtpFor2FA} disabled={sendingOtp}>
                      {sendingOtp && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {sendingOtp ? 'Sending...' : 'Send Verification Code'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <InputOTP 
                        value={otpCode} 
                        onChange={setOtpCode} 
                        maxLength={6}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Button 
                        onClick={handleVerify2FA} 
                        disabled={verifyingOtp || otpCode.length !== 6}
                        className="w-full"
                      >
                        {verifyingOtp && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {verifyingOtp ? 'Verifying...' : 'Enable 2FA'}
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        onClick={handleSendOtpFor2FA} 
                        disabled={sendingOtp}
                        className="text-sm"
                      >
                        {sendingOtp ? 'Sending...' : 'Resend Code'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle>Billing & Payments</CardTitle>
              <CardDescription>
                Manage your payout methods to receive payments for your products and services.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Payout Method Selector */}
              <PayoutMethodSelector
                stripeConnected={!!stripeAccountId}
                stripeOnboardingComplete={stripeOnboardingComplete}
                onConnectStripe={handleConnectStripe}
                connectingStripe={connectingStripe}
                checkingStripeStatus={checkingStripeStatus}
                onCheckStripeStatus={checkStripeStatus}
                onStripeDisconnected={() => {
                  setStripeAccountId(null);
                  setStripeOnboardingComplete(false);
                }}
              />

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

              {/* Add new row button - Issue #6 fix: enforce one link per platform */}
              {(() => {
                const usedPlatforms = socialLinks
                  .map(link => detectSocialPlatform(link.url)?.platform)
                  .filter(Boolean);
                const allPlatformsUsed = usedPlatforms.length >= 4;
                
                return (
                  <>
                    <button
                      onClick={() => {
                        if (!allPlatformsUsed) {
                          setSocialLinks(prev => [...prev, { id: crypto.randomUUID(), url: '' }]);
                        }
                      }}
                      disabled={allPlatformsUsed}
                      className={cn(
                        "text-sm font-medium flex items-center gap-1 transition-colors",
                        allPlatformsUsed 
                          ? "text-muted-foreground cursor-not-allowed" 
                          : "text-primary hover:text-primary/80"
                      )}
                    >
                      <Plus className="w-4 h-4" />
                      {allPlatformsUsed ? 'All platforms linked' : 'Add social link'}
                    </button>
                    
                    {/* Show which platforms are already used */}
                    {usedPlatforms.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {['instagram', 'youtube', 'twitter', 'tiktok'].map(platform => {
                          const isUsed = usedPlatforms.includes(platform);
                          return (
                            <Badge 
                              key={platform} 
                              variant={isUsed ? "default" : "outline"}
                              className={cn(
                                "text-xs capitalize",
                                isUsed ? "bg-primary/20 text-primary border-primary/30" : "text-muted-foreground"
                              )}
                            >
                              {platform === 'twitter' ? 'X' : platform}
                              {isUsed && <span className="ml-1">✓</span>}
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}

              <Separator className="my-4" />

              <p className="text-xs text-muted-foreground">
                Supported platforms: Instagram, YouTube, X (Twitter), TikTok. One link per platform.
              </p>

              <Button onClick={saveProfile} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Seller Email Tab */}
        <TabsContent value="seller-email">
          <SellerEmailSettings userId={user.id} isSeller={isSeller} />
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

      {/* Email Change Dialog */}
      <Dialog open={showEmailChangeDialog} onOpenChange={setShowEmailChangeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Email Address</DialogTitle>
            <DialogDescription>
              {emailOtpSent 
                ? 'Enter the 6-digit code sent to your current email to verify your identity.'
                : 'Enter your new email address. We\'ll send a verification code to your current email for security.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {!emailOtpSent ? (
              <div className="space-y-4">
                <div>
                  <Label>Current Email</Label>
                  <Input
                    value={user?.email || ""}
                    disabled
                    className="mt-2 bg-muted"
                  />
                </div>
                <div>
                  <Label htmlFor="newEmail">New Email Address</Label>
                  <Input
                    id="newEmail"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value.trim())}
                    placeholder="newemail@example.com"
                    className="mt-2"
                  />
                </div>
                <Button 
                  onClick={handleSendEmailChangeOtp} 
                  disabled={sendingEmailOtp || !newEmail}
                  className="w-full"
                >
                  {sendingEmailOtp && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {sendingEmailOtp ? 'Sending...' : 'Send Verification Code'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Verification code sent to: <span className="font-medium text-foreground">{user?.email}</span>
                </p>
                <div className="flex justify-center">
                  <InputOTP 
                    value={emailOtpCode} 
                    onChange={setEmailOtpCode} 
                    maxLength={6}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                
                <div className="space-y-2">
                  <Button 
                    onClick={handleVerifyEmailChange} 
                    disabled={verifyingEmailChange || emailOtpCode.length !== 6}
                    className="w-full"
                  >
                    {verifyingEmailChange && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {verifyingEmailChange ? 'Changing Email...' : 'Verify & Change Email'}
                  </Button>
                  
                  <div className="flex justify-between">
                    <Button 
                      variant="ghost" 
                      onClick={() => setEmailOtpSent(false)}
                      className="text-sm"
                    >
                      ← Change email address
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={handleSendEmailChangeOtp} 
                      disabled={sendingEmailOtp}
                      className="text-sm"
                    >
                      {sendingEmailOtp ? 'Sending...' : 'Resend Code'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
