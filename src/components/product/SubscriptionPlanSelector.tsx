import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Plus, Package, Loader2 } from "lucide-react";
import CreatePlanWizard from "@/components/subscription/CreatePlanWizard";

interface SubscriptionPlan {
  id: string;
  name: string;
  price_cents: number;
  currency: string;
  product_count: number;
}

interface SubscriptionPlanSelectorProps {
  selectedPlanIds: string[];
  onSelectionChange: (planIds: string[]) => void;
}

export function SubscriptionPlanSelector({ 
  selectedPlanIds, 
  onSelectionChange 
}: SubscriptionPlanSelectorProps) {
  const { user } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateWizard, setShowCreateWizard] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch creator's subscription plans
      const { data: plansData, error: plansError } = await supabase
        .from("creator_subscription_plans")
        .select("id, name, price_cents, currency")
        .eq("creator_id", user.id)
        .eq("is_active", true);

      if (plansError) throw plansError;

      // Get product counts for each plan
      const plansWithCounts = await Promise.all(
        (plansData || []).map(async (plan) => {
          const { count } = await supabase
            .from("subscription_plan_products")
            .select("*", { count: "exact", head: true })
            .eq("plan_id", plan.id);
          
          return {
            ...plan,
            product_count: count || 0,
          };
        })
      );

      setPlans(plansWithCounts);
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePlan = (planId: string) => {
    if (selectedPlanIds.includes(planId)) {
      onSelectionChange(selectedPlanIds.filter(id => id !== planId));
    } else {
      onSelectionChange([...selectedPlanIds, planId]);
    }
  };

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  };

  const handlePlanCreated = () => {
    setShowCreateWizard(false);
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-foreground">
        Select Subscription Plan(s)
      </div>
      
      {plans.length === 0 ? (
        <div className="text-center py-6 border border-dashed rounded-lg bg-muted/30">
          <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-3">
            No subscription plans created yet
          </p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowCreateWizard(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Create Subscription Plan
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleTogglePlan(plan.id)}
              >
                <Checkbox
                  checked={selectedPlanIds.includes(plan.id)}
                  onCheckedChange={() => handleTogglePlan(plan.id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{plan.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatPrice(plan.price_cents, plan.currency)}/mo · {plan.product_count} {plan.product_count === 1 ? 'product' : 'products'}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full"
            onClick={() => setShowCreateWizard(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Create New Plan
          </Button>
        </>
      )}

      <CreatePlanWizard 
        open={showCreateWizard}
        onOpenChange={setShowCreateWizard}
        creatorId={user?.id || ""}
        onSuccess={handlePlanCreated}
      />
    </div>
  );
}
