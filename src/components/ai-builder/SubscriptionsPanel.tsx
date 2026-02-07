import { useState, useEffect } from 'react';
import { CreditCard, Plus, Loader2, ExternalLink, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  is_active: boolean;
  stripe_product_id: string | null;
}

interface SubscriptionsPanelProps {
  profileId: string;
  onPlansChange?: () => void;
}

export function SubscriptionsPanel({ profileId, onPlansChange }: SubscriptionsPanelProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('creator_subscription_plans')
      .select('id, name, description, price_cents, currency, is_active, stripe_product_id')
      .eq('creator_id', profileId)
      .order('price_cents', { ascending: true });

    if (!error && data) {
      setPlans(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPlans();
  }, [profileId]);

  const formatPrice = (plan: SubscriptionPlan) => {
    const dollars = plan.price_cents / 100;
    return `$${dollars.toFixed(2)}/mo`;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
          <p className="text-sm text-zinc-500">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Crown className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Your Subscription Plans</h2>
            <p className="text-xs text-zinc-500">
              {plans.length} plan{plans.length !== 1 ? 's' : ''} created
            </p>
          </div>
        </div>
        <Button
          onClick={() => window.open('/settings?tab=subscriptions', '_blank')}
          className="gap-2 bg-violet-600 hover:bg-violet-500 text-white"
          size="sm"
        >
          <Plus className="w-4 h-4" />
          Create Plan
        </Button>
      </div>

      {/* Info Banner */}
      <div className="mx-6 mt-4 p-4 rounded-lg bg-violet-500/10 border border-violet-500/20">
        <p className="text-sm text-violet-300">
          <strong>How it works:</strong> These are your real subscription plans from SellsPay. 
          When the AI creates pricing pages, it will only use these plans — no made-up pricing. 
          Create plans in your Settings to add them here.
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {plans.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 rounded-2xl bg-zinc-800/50 border border-zinc-700 flex items-center justify-center mb-6">
              <CreditCard className="w-10 h-10 text-zinc-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No subscription plans yet</h3>
            <p className="text-zinc-400 max-w-md mb-6">
              Create subscription plans in your Settings to offer recurring access to your content. 
              Once created, they'll appear here and be available for AI-generated pricing pages.
            </p>
            <Button
              onClick={() => window.open('/settings?tab=subscriptions', '_blank')}
              className="gap-2 bg-violet-600 hover:bg-violet-500 text-white"
            >
              <Plus className="w-4 h-4" />
              Create Your First Plan
            </Button>
          </div>
        ) : (
          /* Plans Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="group bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-all"
              >
                {/* Plan Header */}
                <div className="p-4 border-b border-zinc-800">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-white text-lg">
                      {plan.name}
                    </h4>
                    <Badge 
                      className={`text-[10px] font-medium border ${
                        plan.is_active 
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
                      }`}
                    >
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold text-violet-400">
                    {formatPrice(plan)}
                  </p>
                </div>

                {/* Plan Info */}
                <div className="p-4">
                  {plan.description ? (
                    <p className="text-sm text-zinc-400 line-clamp-3 mb-4">
                      {plan.description}
                    </p>
                  ) : (
                    <p className="text-sm text-zinc-500 italic mb-4">
                      No description
                    </p>
                  )}

                  {/* Status indicators */}
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    {plan.stripe_product_id ? (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Connected to Stripe
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        Pending Stripe setup
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Action */}
                <div className="px-4 pb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 text-xs border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300"
                    onClick={() => window.open('/settings?tab=subscriptions', '_blank')}
                  >
                    <ExternalLink className="w-3 h-3" />
                    Manage Plans
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
