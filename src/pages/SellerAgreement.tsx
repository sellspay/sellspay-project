import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Shield, CheckCircle2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

export default function SellerAgreement() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  // If already signed, redirect to dashboard
  useEffect(() => {
    if (profile?.seller_contract_signed_at) {
      navigate('/dashboard');
    }
  }, [profile, navigate]);

  const handleConfirm = async () => {
    if (!user || !agreed) return;

    setLoading(true);
    try {
      // First, update the profile to mark as seller
      const { error } = await supabase
        .from('profiles')
        .update({
          is_seller: true,
          seller_contract_signed_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Silently create Stripe Connect account in background (deferred onboarding)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        try {
          await supabase.functions.invoke('create-silent-connect-account', {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });
        } catch (stripeErr) {
          // Non-blocking - they can still sell, just won't have Stripe ready
          console.warn('Silent Stripe account creation failed (non-blocking):', stripeErr);
        }
      }

      await refreshProfile?.();
      toast.success('Welcome to SellsPay! You can now start selling.');
      
      // Redirect to dashboard instead of settings - they can sell immediately!
      navigate('/dashboard');
    } catch (err) {
      console.error('Error signing agreement:', err);
      toast.error('Failed to process agreement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/10 to-background border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-3">SellsPay Seller Agreement</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Before you can start selling, please review and accept our Seller Contract & Marketplace Agreement.
          </p>
        </div>
      </div>

      {/* Contract Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-card border border-border rounded-2xl p-8 mb-8">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            SELLSPAY SELLER CONTRACT & MARKETPLACE AGREEMENT
          </h2>

          <div className="prose prose-sm prose-invert max-w-none space-y-6 text-muted-foreground">
            <p className="text-foreground font-medium">
              This Agreement is a legally binding contract between you ("Seller") and SellsPay ("Platform"). 
              By clicking "I Agree," you signify that you have read, understood, and agree to the following:
            </p>

            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <h3 className="font-semibold text-foreground mb-2">1. Appointment of Agent</h3>
                <p>
                  You appoint SellsPay as your non-exclusive agent to sell, market, and distribute your digital products.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <h3 className="font-semibold text-foreground mb-2">2. Merchant of Record</h3>
                <p>
                  You acknowledge that SellsPay acts as the Merchant of Record (MoR). SellsPay will process all payments, 
                  handle chargebacks, and collect/remit necessary Sales Tax and VAT.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <h3 className="font-semibold text-foreground mb-2">3. Revenue Split</h3>
                <p>
                  For every sale, SellsPay will retain a <strong className="text-primary">5% platform fee</strong>. 
                  The remaining <strong className="text-emerald-400">95%</strong> will be distributed to your connected Stripe account.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <h3 className="font-semibold text-foreground mb-2">4. Ownership & Responsibility</h3>
                <p>
                  You represent that you own 100% of the rights to the digital products you upload. 
                  You are solely responsible for the content and any claims arising from it.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <h3 className="font-semibold text-foreground mb-2">5. Tax Reporting</h3>
                <p>
                  You are an independent contractor, not an employee. You are responsible for reporting your earnings 
                  to your local tax authorities. SellsPay will issue a 1099-K form where required by law 
                  (e.g., if you exceed $600 in US sales).
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <h3 className="font-semibold text-foreground mb-2">6. Indemnification</h3>
                <p>
                  You agree to hold SellsPay harmless from any legal claims, losses, or damages resulting from 
                  your products or your breach of this agreement.
                </p>
              </div>

              {/* Physical Goods Ban Warning */}
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                <h3 className="font-semibold text-destructive mb-2 flex items-center gap-2">
                  <span className="text-lg">⚠️</span>
                  7. STRICT PHYSICAL GOODS BAN
                </h3>
                <p className="text-destructive/90">
                  <strong>I certify that I will ONLY sell digital products.</strong> I understand that 
                  listing any physical product will result in an <strong>immediate, permanent ban</strong> of 
                  my account and <strong>forfeiture of all pending funds</strong>. There is no appeal 
                  process for physical goods violations.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Agreement Checkbox */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <label className="flex items-start gap-4 cursor-pointer">
            <Checkbox
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked === true)}
              className="mt-1"
            />
            <span className="text-sm leading-relaxed">
              I have read and agree to the <strong>Seller Contract</strong> and I understand that{' '}
              <strong>SellsPay is the Merchant of Record</strong> for my sales. I confirm that I own 
              all rights to the products I will sell and agree to the revenue split and tax responsibilities 
              outlined above. <strong className="text-destructive">I certify that I will ONLY sell digital 
              products and understand that selling physical goods will result in permanent account termination.</strong>
            </span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!agreed || loading}
            className="flex-1 gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Confirm & Become a Seller
              </>
            )}
          </Button>
        </div>

        {/* Trust Indicators */}
        <div className="mt-8 pt-8 border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center text-sm text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span>Secure & Encrypted</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <span>Legally Binding</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span>Instant Activation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
