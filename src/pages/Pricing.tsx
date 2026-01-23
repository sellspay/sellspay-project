import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import MainLayout from "@/components/layout/MainLayout";
import { Wallet, Check, Zap, Music, Mic, Wand2, Loader2, Sparkles, Shield, Clock, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price_cents: number;
  is_popular: boolean;
  display_order: number;
  stripe_price_id: string | null;
}

// Mapping to monthly recurring price IDs
const MONTHLY_PRICE_MAP: Record<number, string> = {
  25: "price_1SssVIE5Ga1Ha0QbMRTCVK4R",  // Starter
  50: "price_1SssVSE5Ga1Ha0Qb0fUFWDk9",  // Basic
  150: "price_1SssVhE5Ga1Ha0Qbt8oDdKvc", // Pro
  350: "price_1SssWzE5Ga1Ha0QbGjeeSuID", // Power
  1000: "price_1SssXEE5Ga1Ha0QbgDYnF7Ds", // Enterprise
};

const proTools = [
  { 
    icon: Wand2, 
    name: "SFX Generator", 
    description: "Create custom sound effects from text descriptions using AI" 
  },
  { 
    icon: Mic, 
    name: "Voice Isolator", 
    description: "Remove background music and isolate vocals from any audio" 
  },
  { 
    icon: Music, 
    name: "Music Splitter", 
    description: "Split audio into separate stems: drums, bass, vocals, and more" 
  },
  { 
    icon: Zap, 
    name: "SFX Isolator", 
    description: "Extract and isolate sound effects from complex audio files" 
  },
];

const faqs = [
  {
    question: "What are credits used for?",
    answer: "Credits are used to access Pro AI audio tools. Each tool usage costs 1 credit. Free tools like Audio Converter, Audio Joiner, and Audio Cutter don't require credits."
  },
  {
    question: "Do credits expire?",
    answer: "Credits reset each month with your subscription. Unused credits don't roll over to the next month, so make sure to use them!"
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes! You can cancel your subscription at any time from Settings → Billing. You'll keep your credits until the end of your billing period."
  },
  {
    question: "What happens if I run out of credits?",
    answer: "You can upgrade to a higher tier anytime. Your subscription will be prorated for the remaining days in your billing cycle."
  },
  {
    question: "Do new users get free credits?",
    answer: "Yes! Every new user receives 3 free credits to try out our Pro tools. No credit card required."
  },
];

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { creditBalance, isLoading: creditsLoading, startCheckout, verifyPurchase, subscription } = useCredits();
  
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  // Fetch packages and handle success/cancel params
  useEffect(() => {
    fetchPackages();
    
    // Handle Stripe redirect
    const sessionId = searchParams.get("session_id");
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    
    if (success === "true" && sessionId) {
      verifyPurchase(sessionId).then(() => {
        toast.success("Subscription activated! Credits added to your wallet.");
        navigate("/pricing", { replace: true });
      });
    } else if (canceled === "true") {
      toast.info("Subscription canceled. No charges were made.");
      navigate("/pricing", { replace: true });
    }
  }, [searchParams]);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from("credit_packages")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      
      const pkgs = data || [];
      setPackages(pkgs);
      
      // Select the popular package by default, or the middle one
      const popularPkg = pkgs.find(p => p.is_popular);
      if (popularPkg) {
        setSelectedPackageId(popularPkg.id);
      } else if (pkgs.length > 0) {
        setSelectedPackageId(pkgs[Math.floor(pkgs.length / 2)]?.id || pkgs[0].id);
      }
    } catch (error) {
      console.error("Error fetching packages:", error);
      toast.error("Failed to load pricing");
    } finally {
      setLoading(false);
    }
  };

  const selectedPackage = packages.find(p => p.id === selectedPackageId);

  const handleSubscribe = async () => {
    if (!user) {
      toast.error("Please sign in to subscribe");
      navigate("/login");
      return;
    }

    if (!selectedPackage) {
      toast.error("Please select a package");
      return;
    }

    // Get the monthly recurring price ID based on credits
    const monthlyPriceId = MONTHLY_PRICE_MAP[selectedPackage.credits];
    if (!monthlyPriceId) {
      toast.error("Invalid package configuration");
      return;
    }

    setPurchasing(true);
    try {
      await startCheckout(selectedPackage.id, monthlyPriceId);
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to start checkout");
    } finally {
      setPurchasing(false);
    }
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  const calculatePerCredit = (pkg: CreditPackage) => {
    return (pkg.price_cents / pkg.credits / 100).toFixed(2);
  };

  const calculateSavings = (pkg: CreditPackage) => {
    // Compare against $0.20 per credit baseline (Starter rate)
    const baselineRate = 0.20;
    const actualRate = pkg.price_cents / pkg.credits / 100;
    const savings = Math.round((1 - actualRate / baselineRate) * 100);
    return savings > 0 ? savings : 0;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Pro AI Tools</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              Unlock Powerful Audio Tools
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get monthly credits to access our suite of AI-powered audio tools. 
              Cancel anytime.
            </p>
          </div>

          {/* Current Balance */}
          {user && (
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary border border-border">
                <Wallet className="h-5 w-5 text-primary" />
                <span className="text-sm">Current Balance:</span>
                <span className="font-bold text-lg">
                  {creditsLoading ? "..." : creditBalance}
                </span>
                <span className="text-sm text-muted-foreground">credits</span>
              </div>
            </div>
          )}

          {/* Active Subscription Notice */}
          {subscription && (
            <div className="max-w-xl mx-auto mb-8">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                <Check className="h-5 w-5 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  You have an active subscription ({subscription.credits} credits/month)
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Renews on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {/* Main Pricing Card */}
          <Card className="max-w-xl mx-auto border-2 border-primary/20 shadow-xl">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Wallet className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-2xl">Credit Subscription</CardTitle>
              <CardDescription>
                Choose your monthly credit allocation
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Package Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Package</label>
                <Select value={selectedPackageId} onValueChange={setSelectedPackageId}>
                  <SelectTrigger className="w-full h-12">
                    <SelectValue placeholder="Choose a package" />
                  </SelectTrigger>
                  <SelectContent>
                    {packages.map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.id}>
                        <div className="flex items-center justify-between w-full gap-4">
                          <span className="font-medium">{pkg.name}</span>
                          <span className="text-muted-foreground">
                            {pkg.credits} credits · ${formatPrice(pkg.price_cents)}/mo
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Selected Package Details */}
              {selectedPackage && (
                <>
                  <div className="text-center py-4 bg-secondary/50 rounded-lg">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold">
                        ${formatPrice(selectedPackage.price_cents)}
                      </span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <div className="flex items-center justify-center gap-3 mt-2">
                      <span className="text-lg font-semibold text-primary">
                        {selectedPackage.credits} Credits
                      </span>
                      {calculateSavings(selectedPackage) > 0 && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                          Save {calculateSavings(selectedPackage)}%
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      ${calculatePerCredit(selectedPackage)} per credit
                    </p>
                  </div>

                  <Separator />

                  {/* Pro Tools List */}
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      What You Unlock
                    </h4>
                    <div className="space-y-2">
                      {proTools.map((tool) => (
                        <div key={tool.name} className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <tool.icon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{tool.name}</p>
                            <p className="text-xs text-muted-foreground">{tool.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Benefits */}
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      Subscription Benefits
                    </h4>
                    <ul className="space-y-2">
                      {[
                        { icon: RefreshCw, text: "Credits refresh monthly" },
                        { icon: Clock, text: "Cancel anytime from Settings" },
                        { icon: Zap, text: "Priority processing" },
                        { icon: Check, text: "Access all Pro tools" },
                      ].map((benefit, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <benefit.icon className="h-4 w-4 text-green-500" />
                          {benefit.text}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Subscribe Button */}
                  <Button 
                    className="w-full h-12 text-base font-semibold" 
                    size="lg"
                    onClick={handleSubscribe}
                    disabled={purchasing || !selectedPackage}
                  >
                    {purchasing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : subscription ? (
                      <>
                        Change Plan · ${formatPrice(selectedPackage.price_cents)}/mo
                      </>
                    ) : (
                      <>
                        Subscribe Now · ${formatPrice(selectedPackage.price_cents)}/mo
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Secure payment via Stripe. Cancel anytime.
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Free Credits Notice */}
          <div className="mt-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-sm">
                <strong>New users:</strong> Get 3 free credits to try Pro tools — no card required!
              </span>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-center mb-8">
              Frequently Asked Questions
            </h2>
            <Accordion type="single" collapsible className="max-w-2xl mx-auto">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
