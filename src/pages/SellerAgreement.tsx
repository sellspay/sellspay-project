import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Loader2, Shield, CheckCircle2, FileText, Calendar, AlertTriangle, 
  CreditCard, Wallet, Globe, Ban 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { differenceInYears, parse } from 'date-fns';

interface CountryDetection {
  countryCode: string;
  countryName: string;
  providers: {
    stripe: boolean;
    paypal: boolean;
    payoneer: boolean;
  };
  recommendedProvider: string;
  hasAnyProvider: boolean;
}

export default function SellerAgreement() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detectingCountry, setDetectingCountry] = useState(true);
  
  // New fields
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [isAdult, setIsAdult] = useState<boolean | null>(null);
  const [payoutMethod, setPayoutMethod] = useState<string>('');
  const [countryInfo, setCountryInfo] = useState<CountryDetection | null>(null);

  // If already signed, redirect to dashboard
  useEffect(() => {
    if (profile?.seller_contract_signed_at) {
      navigate('/dashboard');
    }
  }, [profile, navigate]);

  // Detect country on mount
  useEffect(() => {
    detectCountry();
  }, []);

  const detectCountry = async () => {
    setDetectingCountry(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('detect-country', {
        headers: session ? {
          Authorization: `Bearer ${session.access_token}`,
        } : {},
      });

      if (error) throw error;

      setCountryInfo(data);
      
      // Auto-select recommended provider
      if (data?.recommendedProvider) {
        setPayoutMethod(data.recommendedProvider);
      }
    } catch (err) {
      console.error('Error detecting country:', err);
      // Default fallback
      setCountryInfo({
        countryCode: 'US',
        countryName: 'United States',
        providers: { stripe: true, paypal: true, payoneer: true },
        recommendedProvider: 'stripe',
        hasAnyProvider: true,
      });
      setPayoutMethod('stripe');
    } finally {
      setDetectingCountry(false);
    }
  };

  // Validate age when DOB changes
  const handleDobChange = useCallback((value: string) => {
    setDateOfBirth(value);
    
    if (value) {
      try {
        const birthDate = parse(value, 'yyyy-MM-dd', new Date());
        const age = differenceInYears(new Date(), birthDate);
        setIsAdult(age >= 18);
      } catch {
        setIsAdult(null);
      }
    } else {
      setIsAdult(null);
    }
  }, []);

  const handleConfirm = async () => {
    if (!user || !agreed || !isAdult || !payoutMethod) return;

    setLoading(true);
    try {
      // Update the profile with all seller info
      const { error } = await supabase
        .from('profiles')
        .update({
          is_seller: true,
          seller_contract_signed_at: new Date().toISOString(),
          date_of_birth: dateOfBirth,
          payout_method: payoutMethod,
          seller_country_code: countryInfo?.countryCode || null,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Silently create Stripe Connect account if Stripe is selected
      const { data: { session } } = await supabase.auth.getSession();
      if (session && payoutMethod === 'stripe') {
        try {
          await supabase.functions.invoke('create-silent-connect-account', {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });
        } catch (stripeErr) {
          console.warn('Silent Stripe account creation failed (non-blocking):', stripeErr);
        }
      }

      await refreshProfile?.();
      toast.success('Welcome to SellsPay! You can now start selling.');
      navigate('/dashboard');
    } catch (err) {
      console.error('Error signing agreement:', err);
      toast.error('Failed to process agreement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate platform fee based on subscription tier
  // Note: We'd need to fetch this from profile or a separate query
  // For now, default to 10% (free tier) - this can be enhanced later
  const getPlatformFee = () => {
    // Could be fetched from profile.platform_fee_percent if available
    return 10;
  };

  const creatorShare = 100 - getPlatformFee();
  const canSubmit = agreed && isAdult === true && payoutMethod && !detectingCountry;

  // Show "Not Available" screen if no providers work
  if (!detectingCountry && countryInfo && !countryInfo.hasAnyProvider) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 border border-destructive/20 mb-6">
            <Ban className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Not Yet Available in Your Region</h1>
          <p className="text-muted-foreground mb-6">
            Unfortunately, SellsPay is not yet available in <strong>{countryInfo.countryName}</strong>. 
            Our payment providers do not currently support sellers in your country.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            We're working to expand to more regions. Please check back later or contact support 
            if you believe this is an error.
          </p>
          <Button variant="outline" onClick={() => navigate('/')}>
            Return Home
          </Button>
        </div>
      </div>
    );
  }

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
            Complete your seller profile and accept our Marketplace Agreement to start selling.
          </p>
          {countryInfo && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{countryInfo.countryName}</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Step 1: Age Verification */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Age Verification
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            You must be at least 18 years old to sell on SellsPay.
          </p>
          <div className="max-w-xs">
            <Label htmlFor="dob">Date of Birth</Label>
            <Input
              id="dob"
              type="date"
              value={dateOfBirth}
              onChange={(e) => handleDobChange(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="mt-1"
            />
            {isAdult === false && (
              <p className="text-sm text-destructive mt-2 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                You must be 18 or older to become a seller.
              </p>
            )}
            {isAdult === true && (
              <p className="text-sm text-emerald-500 mt-2 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Age verified
              </p>
            )}
          </div>
        </div>

        {/* Step 2: Payout Method Selection */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Payout Method
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Choose how you'd like to receive your earnings. You can change this later in Settings.
          </p>
          
          {detectingCountry ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Detecting your location...
            </div>
          ) : (
            <RadioGroup value={payoutMethod} onValueChange={setPayoutMethod} className="space-y-3">
              {countryInfo?.providers.stripe && (
                <label className="flex items-center gap-4 p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors">
                  <RadioGroupItem value="stripe" id="stripe" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-[#635BFF]" />
                      <span className="font-medium">Stripe Connect</span>
                      {countryInfo.recommendedProvider === 'stripe' && (
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Direct bank deposits. Fastest payouts with lowest fees.
                    </p>
                  </div>
                </label>
              )}
              
              {countryInfo?.providers.paypal && (
                <label className="flex items-center gap-4 p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors">
                  <RadioGroupItem value="paypal" id="paypal" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[#003087] font-bold text-lg">P</span>
                      <span className="font-medium">PayPal</span>
                      {countryInfo.recommendedProvider === 'paypal' && (
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                          Recommended for {countryInfo.countryName}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Global reach. Standard PayPal transfer fees apply.
                    </p>
                  </div>
                </label>
              )}
              
              {countryInfo?.providers.payoneer && (
                <label className="flex items-center gap-4 p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors">
                  <RadioGroupItem value="payoneer" id="payoneer" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[#FF4800] font-bold text-lg">◉</span>
                      <span className="font-medium">Payoneer</span>
                      {countryInfo.recommendedProvider === 'payoneer' && (
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                          Best for {countryInfo.countryName}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Great for emerging markets. Multi-currency support.
                    </p>
                  </div>
                </label>
              )}
            </RadioGroup>
          )}
        </div>

        {/* Contract Content */}
        <div className="bg-card border border-border rounded-2xl p-8">
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
                <h3 className="font-semibold text-foreground mb-2">2. Merchant of Record (MoR)</h3>
                <p>
                  You acknowledge that <strong>SellsPay acts as the Merchant of Record</strong>. SellsPay will process all payments, 
                  handle chargebacks, and collect/remit necessary <strong>Sales Tax and VAT</strong> on your behalf. 
                  You are not responsible for tax collection.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <h3 className="font-semibold text-foreground mb-2">3. Revenue Split</h3>
                <p>
                  For every sale, SellsPay will retain a <strong className="text-primary">{getPlatformFee()}% platform fee</strong>. 
                  The remaining <strong className="text-emerald-400">{creatorShare}%</strong> will be distributed to your 
                  chosen payout method ({payoutMethod ? payoutMethod.charAt(0).toUpperCase() + payoutMethod.slice(1) : 'selected provider'}).
                </p>
                <p className="text-sm mt-2">
                  Note: Your payout provider may charge additional transfer/FX fees. These are separate from SellsPay fees.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <h3 className="font-semibold text-foreground mb-2">4. Payout Consent</h3>
                <p>
                  You agree that your earnings will be distributed via <strong>{payoutMethod || 'your chosen provider'}</strong>. 
                  You understand that you must complete identity verification before withdrawing funds, and you are 
                  responsible for any provider-specific fees (e.g., PayPal transfer fees, Payoneer FX rates).
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <h3 className="font-semibold text-foreground mb-2">5. Ownership & Responsibility</h3>
                <p>
                  You represent that you own 100% of the rights to the digital products you upload. 
                  You are solely responsible for the content and any claims arising from it.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <h3 className="font-semibold text-foreground mb-2">6. Tax Reporting</h3>
                <p>
                  You are an independent contractor, not an employee. You are responsible for reporting your earnings 
                  to your local tax authorities. SellsPay will issue a 1099-K form where required by law 
                  (e.g., if you exceed $600 in US sales).
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <h3 className="font-semibold text-foreground mb-2">7. Indemnification</h3>
                <p>
                  You agree to hold SellsPay harmless from any legal claims, losses, or damages resulting from 
                  your products or your breach of this agreement.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <h3 className="font-semibold text-foreground mb-2">8. Deferred Verification</h3>
                <p>
                  You may begin selling immediately upon signing this agreement. However, <strong>funds will be held 
                  until you successfully complete identity and bank verification</strong>. If you are unable to pass 
                  verification, SellsPay may be required to refund the customers, and you will not receive the funds.
                </p>
              </div>

              {/* Physical Goods Ban Warning */}
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                <h3 className="font-semibold text-destructive mb-2 flex items-center gap-2">
                  <span className="text-lg">⚠️</span>
                  9. STRICT DIGITAL-ONLY MANDATE
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
        <div className="bg-card border border-border rounded-2xl p-6">
          <label className="flex items-start gap-4 cursor-pointer">
            <Checkbox
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked === true)}
              disabled={!isAdult || !payoutMethod}
              className="mt-1"
            />
            <span className="text-sm leading-relaxed">
              I have read and agree to the <strong>Seller Contract</strong>. I confirm that I am at least 
              18 years old, I own all rights to the products I will sell, I understand that{' '}
              <strong>SellsPay is the Merchant of Record</strong>, and I agree to receive my{' '}
              <strong>{creatorShare}% share</strong> via{' '}
              <strong>{payoutMethod ? payoutMethod.charAt(0).toUpperCase() + payoutMethod.slice(1) : 'my chosen provider'}</strong>.{' '}
              <strong className="text-destructive">I certify that I will ONLY sell digital 
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
            disabled={!canSubmit || loading}
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
        <div className="pt-8 border-t border-border">
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
              <span>Start Selling Immediately</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
