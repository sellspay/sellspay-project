import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, CreditCard, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  productCount: number;
}

interface SubscribeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creatorId: string;
  creatorName: string;
}

export default function SubscribeDialog({ open, onOpenChange, creatorId, creatorName }: SubscribeDialogProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [activeSubscriptions, setActiveSubscriptions] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      fetchPlans();
      if (user) {
        fetchActiveSubscriptions();
      }
    }
  }, [open, creatorId, user]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      // Fetch active plans for this creator
      const { data: plansData, error } = await supabase
        .from('creator_subscription_plans')
        .select('id, name, description, price_cents, currency')
        .eq('creator_id', creatorId)
        .eq('is_active', true)
        .order('price_cents', { ascending: true });

      if (error) throw error;

      // Get product counts for each plan
      const plansWithCounts = await Promise.all(
        (plansData || []).map(async (plan) => {
          const { count } = await supabase
            .from('subscription_plan_products')
            .select('*', { count: 'exact', head: true })
            .eq('plan_id', plan.id);

          return {
            ...plan,
            productCount: count || 0,
          };
        })
      );

      setPlans(plansWithCounts);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveSubscriptions = async () => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (!profileData) return;

      const { data: subs } = await supabase
        .from('user_subscriptions')
        .select('plan_id')
        .eq('user_id', profileData.id)
        .eq('status', 'active');

      setActiveSubscriptions((subs || []).map(s => s.plan_id));
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    setSubscribing(planId);
    try {
      // Call edge function to create checkout session
      const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
        body: { plan_id: planId },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast.error(error.message || 'Failed to start checkout');
    } finally {
      setSubscribing(null);
    }
  };

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Subscribe to {creatorName}
          </DialogTitle>
          <DialogDescription>
            Get instant access to exclusive content with a monthly subscription
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No subscription plans available yet</p>
            </div>
          ) : (
            plans.map((plan) => {
              const isSubscribed = activeSubscriptions.includes(plan.id);

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-xl border p-4 transition-all ${
                    isSubscribed
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {isSubscribed && (
                    <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground">
                      <Check className="h-3 w-3 mr-1" />
                      Subscribed
                    </Badge>
                  )}

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{plan.name}</h3>
                      {plan.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {plan.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <span>{plan.productCount} products included</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {formatPrice(plan.price_cents, plan.currency)}
                      </div>
                      <div className="text-xs text-muted-foreground">per month</div>
                    </div>
                  </div>

                  {!isSubscribed && (
                    <Button
                      className="w-full mt-4"
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={subscribing === plan.id}
                    >
                      {subscribing === plan.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Subscribe Now
                        </>
                      )}
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Secure payment powered by Stripe. Cancel anytime.
        </p>
      </DialogContent>
    </Dialog>
  );
}