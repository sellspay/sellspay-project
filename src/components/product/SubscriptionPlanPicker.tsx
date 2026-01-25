import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Plus, Crown, Sparkles, ChevronLeft, Check, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubscriptionPlan {
  id: string;
  name: string;
  price_cents: number;
  currency: string;
  is_active: boolean;
}

interface PlanConfig {
  planId: string;
  planName: string;
  planPriceCents: number;
  isFree: boolean;
  discountPercent: number | null;
}

interface SubscriptionPlanPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creatorId: string;
  pricingType: 'subscription' | 'both';
  onConfirm: (selectedPlans: PlanConfig[]) => void;
}

export default function SubscriptionPlanPicker({
  open,
  onOpenChange,
  creatorId,
  pricingType,
  onConfirm,
}: SubscriptionPlanPickerProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'select' | 'configure' | 'create'>('select');
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);
  const [planConfigs, setPlanConfigs] = useState<Record<string, { isFree: boolean; discountPercent: number | null }>>({});
  
  // Create plan form state
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanPrice, setNewPlanPrice] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (open && creatorId) {
      fetchPlans();
    }
  }, [open, creatorId]);

  useEffect(() => {
    if (!open) {
      // Reset state when dialog closes
      setStep('select');
      setSelectedPlanIds([]);
      setPlanConfigs({});
    }
  }, [open]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('creator_subscription_plans')
        .select('id, name, price_cents, currency, is_active')
        .eq('creator_id', creatorId)
        .eq('is_active', true)
        .order('price_cents', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const togglePlanSelection = (planId: string) => {
    setSelectedPlanIds(prev => {
      if (prev.includes(planId)) {
        return prev.filter(id => id !== planId);
      }
      return [...prev, planId];
    });
  };

  const updatePlanConfig = (planId: string, config: { isFree?: boolean; discountPercent?: number | null }) => {
    setPlanConfigs(prev => ({
      ...prev,
      [planId]: {
        isFree: config.isFree ?? prev[planId]?.isFree ?? false,
        discountPercent: config.isFree ? null : (config.discountPercent ?? prev[planId]?.discountPercent ?? null),
      }
    }));
  };

  const handleCreatePlan = async () => {
    if (!newPlanName.trim() || !newPlanPrice) {
      toast.error('Please fill in plan name and price');
      return;
    }

    setCreating(true);
    try {
      const priceCents = Math.round(parseFloat(newPlanPrice) * 100);
      
      const { data, error } = await supabase
        .from('creator_subscription_plans')
        .insert({
          creator_id: creatorId,
          name: newPlanName.trim(),
          price_cents: priceCents,
          currency: 'USD',
        })
        .select('id, name, price_cents, currency, is_active')
        .single();

      if (error) throw error;

      setPlans(prev => [...prev, data]);
      setSelectedPlanIds(prev => [...prev, data.id]);
      setNewPlanName('');
      setNewPlanPrice('');
      setStep('select');
      toast.success('Plan created!');
    } catch (error) {
      console.error('Error creating plan:', error);
      toast.error('Failed to create plan');
    } finally {
      setCreating(false);
    }
  };

  const handleContinue = () => {
    if (selectedPlanIds.length === 0) {
      toast.error('Please select at least one subscription plan');
      return;
    }
    
    // Initialize configs for selected plans
    selectedPlanIds.forEach(planId => {
      if (!planConfigs[planId]) {
        setPlanConfigs(prev => ({
          ...prev,
          [planId]: { isFree: true, discountPercent: null }
        }));
      }
    });
    
    setStep('configure');
  };

  const handleConfirm = () => {
    const configs: PlanConfig[] = selectedPlanIds.map(planId => {
      const plan = plans.find(p => p.id === planId);
      const config = planConfigs[planId] || { isFree: true, discountPercent: null };
      return {
        planId,
        planName: plan?.name || '',
        planPriceCents: plan?.price_cents || 0,
        isFree: config.isFree,
        discountPercent: config.discountPercent,
      };
    });
    
    onConfirm(configs);
    onOpenChange(false);
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            {step === 'select' && 'Select Subscription Plans'}
            {step === 'configure' && 'Configure Access'}
            {step === 'create' && 'Create New Plan'}
          </DialogTitle>
          <DialogDescription>
            {step === 'select' && 'Choose which subscription plans will include this product'}
            {step === 'configure' && 'Set how subscribers access this product'}
            {step === 'create' && 'Create a new subscription plan for your audience'}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Select Plans */}
        {step === 'select' && (
          <div className="space-y-4 py-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-8">
                <Crown className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground mb-4">
                  You don't have any subscription plans yet.
                </p>
                <Button onClick={() => setStep('create')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Plan
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                        selectedPlanIds.includes(plan.id) 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-primary/50"
                      )}
                      onClick={() => togglePlanSelection(plan.id)}
                    >
                      <Checkbox
                        checked={selectedPlanIds.includes(plan.id)}
                        onCheckedChange={() => togglePlanSelection(plan.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{plan.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatPrice(plan.price_cents)}/month
                        </p>
                      </div>
                      {selectedPlanIds.includes(plan.id) && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep('create')}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Plan
                  </Button>
                </div>
              </>
            )}

            {plans.length > 0 && (
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleContinue} 
                  disabled={selectedPlanIds.length === 0}
                >
                  Continue
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Configure Access */}
        {step === 'configure' && (
          <div className="space-y-4 py-4">
            <div className="space-y-4">
              {selectedPlanIds.map((planId) => {
                const plan = plans.find(p => p.id === planId);
                const config = planConfigs[planId] || { isFree: true, discountPercent: null };
                
                return (
                  <div key={planId} className="p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-2 mb-3">
                      <Crown className="w-4 h-4 text-primary" />
                      <span className="font-medium">{plan?.name}</span>
                      <span className="text-sm text-muted-foreground">
                        ({formatPrice(plan?.price_cents || 0)}/mo)
                      </span>
                    </div>
                    
                    <RadioGroup
                      value={config.isFree ? 'free' : 'discount'}
                      onValueChange={(value) => updatePlanConfig(planId, { isFree: value === 'free' })}
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="free" id={`free-${planId}`} />
                        <Label htmlFor={`free-${planId}`} className="flex items-center gap-2 cursor-pointer">
                          <Sparkles className="w-4 h-4 text-emerald-500" />
                          Free for subscribers
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="discount" id={`discount-${planId}`} />
                        <Label htmlFor={`discount-${planId}`} className="cursor-pointer">
                          Discount
                        </Label>
                        {!config.isFree && (
                          <div className="flex items-center gap-1 ml-2">
                            <Input
                              type="number"
                              min="1"
                              max="99"
                              placeholder="15"
                              value={config.discountPercent || ''}
                              onChange={(e) => updatePlanConfig(planId, { 
                                isFree: false, 
                                discountPercent: e.target.value ? parseInt(e.target.value) : null 
                              })}
                              className="w-20 h-8"
                            />
                            <span className="text-sm text-muted-foreground">% off</span>
                          </div>
                        )}
                      </div>
                    </RadioGroup>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setStep('select')}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleConfirm}>
                <Check className="w-4 h-4 mr-2" />
                Confirm
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Create Plan */}
        {step === 'create' && (
          <div className="space-y-4 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="plan-name">Plan Name *</Label>
                <Input
                  id="plan-name"
                  placeholder="e.g., Premium Access"
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="plan-price">Monthly Price (USD) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="plan-price"
                    type="number"
                    min="0.99"
                    step="0.01"
                    placeholder="19.99"
                    value={newPlanPrice}
                    onChange={(e) => setNewPlanPrice(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Minimum price is $0.99. A 5% platform fee applies.
                </p>
              </div>
            </div>

            <div className="flex justify-between gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setStep('select')}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={handleCreatePlan} 
                disabled={creating || !newPlanName.trim() || !newPlanPrice}
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Create Plan
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
