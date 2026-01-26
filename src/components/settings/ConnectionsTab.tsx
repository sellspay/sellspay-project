import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, Link2, Unlink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

interface ConnectedIdentity {
  provider: string;
  email?: string;
  connected: boolean;
}

const PROVIDERS = [
  {
    id: "google",
    name: "Google",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    ),
    color: "bg-white hover:bg-gray-50 text-gray-700 border-gray-200",
  },
  {
    id: "discord",
    name: "Discord",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
      </svg>
    ),
    color: "bg-[#5865F2] hover:bg-[#4752C4] text-white border-[#5865F2]",
  },
];

export function ConnectionsTab() {
  const { user } = useAuth();
  const [identities, setIdentities] = useState<ConnectedIdentity[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadIdentities();
    }
  }, [user]);

  const loadIdentities = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get current user's identities from Supabase auth
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (currentUser) {
        const supabaseIdentities = currentUser.identities || [];
        
        // Check for Google via Supabase identities
        const hasGoogle = supabaseIdentities.some(id => id.provider === "google");
        const googleIdentity = supabaseIdentities.find(id => id.provider === "google");
        
        // Check for Discord via user_metadata (our custom flow stores it there)
        const hasDiscord = !!currentUser.user_metadata?.discord_id;
        const discordUsername = currentUser.user_metadata?.discord_username;
        
        const allIdentities: ConnectedIdentity[] = [
          {
            provider: "google",
            email: googleIdentity?.identity_data?.email,
            connected: hasGoogle,
          },
          {
            provider: "discord",
            email: discordUsername ? `@${discordUsername}` : undefined,
            connected: hasDiscord,
          },
        ];
        
        setIdentities(allIdentities);
      }
    } catch (error) {
      console.error("Error loading identities:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectProvider = async (providerId: string) => {
    setConnectingProvider(providerId);
    try {
      if (providerId === "google") {
        const { error } = await supabase.auth.linkIdentity({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/settings?tab=connections`,
          },
        });
        
        if (error) throw error;
      } else if (providerId === "discord") {
        // For Discord, we need to use our custom flow
        const { data, error } = await supabase.functions.invoke("initiate-discord-login", {
          body: { 
            returnTo: "/settings?tab=connections",
            linkAccount: true, // Flag to indicate we're linking, not signing in
          },
        });
        
        if (error) throw error;
        
        if (data?.notConfigured) {
          toast.error("Discord connection is not configured yet.");
          return;
        }
        
        if (data?.authUrl) {
          window.location.href = data.authUrl;
        }
      }
    } catch (error: any) {
      console.error("Error connecting provider:", error);
      if (error.message?.includes("already linked")) {
        toast.error("This account is already connected to another user.");
      } else {
        toast.error(error.message || "Failed to connect account");
      }
    } finally {
      setConnectingProvider(null);
    }
  };

  const handleDisconnectProvider = async (providerId: string) => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        toast.error("Unable to get user info");
        return;
      }
      
      // Count connected methods
      const supabaseIdentities = currentUser.identities || [];
      const hasGoogle = supabaseIdentities.some(id => id.provider === "google");
      const hasDiscord = !!currentUser.user_metadata?.discord_id;
      const hasEmail = supabaseIdentities.some(id => id.provider === "email");
      
      const connectedCount = [hasGoogle, hasDiscord, hasEmail].filter(Boolean).length;
      
      if (connectedCount <= 1) {
        toast.error("You must keep at least one login method connected.");
        return;
      }
      
      if (providerId === "discord") {
        // For Discord, we need to set metadata fields to null to remove them
        // (updateUser merges data, so we must explicitly null the fields)
        const { error } = await supabase.auth.updateUser({
          data: {
            discord_id: null,
            discord_username: null,
          },
        });
        
        if (error) throw error;
        
        toast.success("Discord disconnected");
        await loadIdentities();
        return;
      }
      
      // For other providers (Google), use Supabase's unlinkIdentity
      const identity = supabaseIdentities.find(id => id.provider === providerId);
      if (!identity) {
        toast.error("Identity not found");
        return;
      }
      
      const { error } = await supabase.auth.unlinkIdentity(identity);
      
      if (error) throw error;
      
      toast.success(`${PROVIDERS.find(p => p.id === providerId)?.name} disconnected`);
      await loadIdentities();
    } catch (error: any) {
      console.error("Error disconnecting provider:", error);
      toast.error(error.message || "Failed to disconnect account");
    }
  };

  const getProvider = (id: string) => PROVIDERS.find(p => p.id === id);

  if (loading) {
    return (
      <Card className="bg-card/50">
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="w-5 h-5" />
          Connected Accounts
        </CardTitle>
        <CardDescription>
          Connect additional sign-in methods to your account. You can use any connected method to log in.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {PROVIDERS.map((provider) => {
          const identity = identities.find(i => i.provider === provider.id);
          const isConnected = identity?.connected || false;
          const isConnecting = connectingProvider === provider.id;
          
          return (
            <div
              key={provider.id}
              className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/30"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${provider.id === 'discord' ? 'bg-[#5865F2]' : 'bg-white'}`}>
                  {provider.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{provider.name}</span>
                    {isConnected && (
                      <Badge variant="secondary" className="text-xs">
                        <Check className="w-3 h-3 mr-1" />
                        Connected
                      </Badge>
                    )}
                  </div>
                  {identity?.email && (
                    <p className="text-sm text-muted-foreground">{identity.email}</p>
                  )}
                </div>
              </div>
              
              <div>
                {isConnected ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnectProvider(provider.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Unlink className="w-4 h-4 mr-1" />
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleConnectProvider(provider.id)}
                    disabled={isConnecting}
                  >
                    {isConnecting ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Link2 className="w-4 h-4 mr-1" />
                    )}
                    Connect
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        
        <p className="text-xs text-muted-foreground mt-4">
          Note: You must keep at least one login method connected to your account.
        </p>
      </CardContent>
    </Card>
  );
}
