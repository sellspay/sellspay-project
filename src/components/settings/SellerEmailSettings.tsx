import { useState, useEffect } from "react";
import { Mail, Loader2, CheckCircle, ExternalLink, Key, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SellerEmailSettingsProps {
  userId: string;
  isSeller: boolean;
}

interface EmailConfig {
  support_email: string | null;
  verified: boolean;
  has_api_key: boolean;
}

export function SellerEmailSettings({ userId, isSeller }: SellerEmailSettingsProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [emailConfig, setEmailConfig] = useState<EmailConfig | null>(null);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  useEffect(() => {
    if (isSeller) {
      fetchEmailConfig();
    } else {
      setLoading(false);
    }
  }, [userId, isSeller]);

  const fetchEmailConfig = async () => {
    try {
      const { data, error } = await supabase.rpc("get_seller_email_config", {
        p_seller_user_id: userId
      });

      if (error) throw error;

      const config = data as unknown as EmailConfig;
      setEmailConfig(config);
      if (config?.support_email) {
        setSupportEmail(config.support_email);
      }
    } catch (error) {
      console.error("Error fetching email config:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndSave = async () => {
    if (!apiKey.trim() || !supportEmail.trim()) {
      toast.error("Please enter both API key and support email");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(supportEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-seller-email", {
        body: { 
          apiKey: apiKey.trim(), 
          supportEmail: supportEmail.trim() 
        }
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || "Verification failed");
      }

      toast.success("Email configuration verified and saved! Check your inbox for a test email.");
      setApiKey("");
      setShowApiKeyInput(false);
      await fetchEmailConfig();
    } catch (error: any) {
      console.error("Error verifying email:", error);
      const message = error?.message || "Failed to verify email configuration";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (!isSeller) {
    return (
      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Seller Email
          </CardTitle>
          <CardDescription>
            Custom email settings are only available for seller accounts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Switch to a seller account in the Security tab to access custom email features.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="bg-card/50">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const isConnected = emailConfig?.has_api_key && emailConfig?.verified;

  return (
    <Card className="bg-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Seller Email
          {isConnected && (
            <Badge variant="secondary" className="bg-primary/20 text-primary ml-2">
              <CheckCircle className="w-3 h-3 mr-1" />
              Connected
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Send emails to your customers from your own email address using Resend.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Card */}
        <div className={`p-6 rounded-lg border ${
          isConnected 
            ? 'bg-primary/10 border-primary/30' 
            : 'bg-gradient-to-br from-primary/10 to-accent/10 border-border'
        }`}>
          <div className="space-y-4">
            {isConnected ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Custom email configured</p>
                    <p className="text-sm text-muted-foreground">
                      Emails will be sent from <span className="text-foreground font-mono">{emailConfig?.support_email}</span>
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your customers will receive purchase receipts, support replies, and product announcements from your email address.
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Connect your email</p>
                    <p className="text-sm text-muted-foreground">
                      Send emails from your own domain to build trust with customers
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Configuration Form */}
        {(showApiKeyInput || !isConnected) && (
          <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
            <div className="space-y-4">
              <div>
                <Label htmlFor="supportEmail">Support Email Address</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  placeholder="support@yourbusiness.com"
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This must match a verified domain in your Resend account
                </p>
              </div>
              
              <div>
                <Label htmlFor="apiKey" className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Resend API Key
                </Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="mt-2 font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your API key is stored encrypted and never exposed
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleVerifyAndSave} 
                disabled={saving || !apiKey.trim() || !supportEmail.trim()}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Verify & Connect
                  </>
                )}
              </Button>
              {isConnected && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowApiKeyInput(false);
                    setApiKey("");
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Update Button for connected users */}
        {isConnected && !showApiKeyInput && (
          <Button 
            variant="outline" 
            onClick={() => setShowApiKeyInput(true)}
          >
            <Key className="w-4 h-4 mr-2" />
            Update Email Configuration
          </Button>
        )}

        {/* Help Section */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-2">How to get your Resend API key:</h4>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Sign up at <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">resend.com <ExternalLink className="w-3 h-3" /></a></li>
            <li>Verify your domain in the <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Domains section <ExternalLink className="w-3 h-3" /></a></li>
            <li>Create an API key in the <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">API Keys section <ExternalLink className="w-3 h-3" /></a></li>
            <li>Enter the API key and your verified email above</li>
          </ol>
        </div>

        {/* Email Types Info */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-2">What emails will be sent from your address:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary" />
              Purchase receipts & download links
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary" />
              Support replies to customers
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary" />
              Product update announcements
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
