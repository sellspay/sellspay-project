import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';

interface Step4Props {
  stripeConnected: boolean;
  onStripeStatusChange: (connected: boolean) => void;
}

export default function Step4StripeSetup({ stripeConnected, onStripeStatusChange }: Step4Props) {
  const { user } = useAuth();
  const [checking, setChecking] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const checkStripeStatus = async () => {
    if (!user) return;
    
    setChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-connect-status');
      
      if (error) {
        console.error('Error checking Stripe status:', error);
        onStripeStatusChange(false);
        return;
      }

      const isConnected = data?.connected && data?.onboarding_complete;
      onStripeStatusChange(isConnected);
    } catch (error) {
      console.error('Error checking Stripe status:', error);
      onStripeStatusChange(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkStripeStatus();
  }, [user]);

  const handleConnectStripe = async () => {
    if (!user) return;
    
    setConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-connect-account', {
        body: { returnUrl: window.location.href }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        toast.info('Complete Stripe setup in the new tab, then click "Refresh Status"');
      }
    } catch (error: any) {
      console.error('Error connecting Stripe:', error);
      toast.error(error.message || 'Failed to start Stripe connection');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="space-y-6 py-4">
      <div>
        <Label className="text-lg font-semibold">Payment Setup Required</Label>
        <p className="text-sm text-muted-foreground mt-1">
          To receive payments from clients, you must connect your Stripe account. This is required before you can submit your application.
        </p>
      </div>

      {checking ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Status Card */}
          <div className={`p-6 rounded-lg border-2 ${stripeConnected ? 'border-primary/50 bg-primary/10' : 'border-destructive/50 bg-destructive/10'}`}>
            <div className="flex items-center gap-3">
              {stripeConnected ? (
                <CheckCircle2 className="w-8 h-8 text-primary flex-shrink-0" />
              ) : (
                <AlertCircle className="w-8 h-8 text-destructive flex-shrink-0" />
              )}
              <div className="flex-1">
                <h3 className="font-semibold">
                  {stripeConnected ? 'Stripe Connected' : 'Stripe Not Connected'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {stripeConnected 
                    ? 'Your Stripe account is set up and ready to receive payments.' 
                    : 'You need to connect and complete Stripe onboarding to accept payments from clients.'}
                </p>
              </div>
              <Badge variant={stripeConnected ? 'default' : 'destructive'}>
                {stripeConnected ? 'Ready' : 'Required'}
              </Badge>
            </div>
          </div>

          {/* Action Buttons */}
          {!stripeConnected && (
            <div className="space-y-3">
              <Button 
                onClick={handleConnectStripe} 
                disabled={connecting}
                className="w-full"
                size="lg"
              >
                {connecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting Stripe Setup...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Connect Stripe Account
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={checkStripeStatus}
                disabled={checking}
                className="w-full"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
                Refresh Status
              </Button>
            </div>
          )}

          {stripeConnected && (
            <div className="p-4 rounded-lg bg-secondary/50 border">
              <p className="text-sm text-muted-foreground">
                ✓ You're all set! Click "Submit Application" to complete your application.
              </p>
            </div>
          )}

          {/* Info Box */}
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <h4 className="text-sm font-medium mb-2">Why is this required?</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Clients pay directly through the platform</li>
              <li>• Stripe handles secure payment processing</li>
              <li>• You'll receive payouts directly to your bank account</li>
              <li>• 5% platform fee (3% for Pro, 0% for Enterprise)</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
