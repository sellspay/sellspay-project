import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Check, DollarSign, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreatePlanWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creatorId: string;
  onSuccess: () => void;
}

const STEPS = [
  { id: 1, name: 'Plan Details', description: 'Name, description & price' },
  { id: 2, name: 'Review & Confirm', description: 'Verify your plan' },
];

export default function CreatePlanWizard({
  open,
  onOpenChange,
  creatorId,
  onSuccess,
}: CreatePlanWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  
  // Plan details
  const [planName, setPlanName] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [planPrice, setPlanPrice] = useState('');

  const resetForm = () => {
    setCurrentStep(1);
    setPlanName('');
    setPlanDescription('');
    setPlanPrice('');
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(resetForm, 300);
  };

  const canProceed = () => {
    if (currentStep === 1) {
      return planName.trim() && planPrice && parseFloat(planPrice) >= 0.99;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep < 2 && canProceed()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!creatorId || !planName.trim() || !planPrice) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const priceCents = Math.round(parseFloat(planPrice) * 100);

      const { error: planError } = await supabase
        .from('creator_subscription_plans')
        .insert({
          creator_id: creatorId,
          name: planName.trim(),
          description: planDescription.trim() || null,
          price_cents: priceCents,
          currency: 'USD',
        });

      if (planError) throw planError;

      toast.success('Subscription plan created! You can add products when creating or editing them.');
      handleClose();
      onSuccess();
    } catch (error) {
      console.error('Error creating plan:', error);
      toast.error('Failed to create subscription plan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            Create Subscription Plan
          </DialogTitle>
          <DialogDescription>
            Set up a new subscription tier for your audience
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-4 py-4">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                    currentStep === step.id
                      ? 'bg-primary text-primary-foreground'
                      : currentStep > step.id
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {currentStep > step.id ? <Check className="h-5 w-5" /> : step.id}
                </div>
                <span className="text-xs mt-1 text-muted-foreground hidden sm:block">
                  {step.name}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'w-12 sm:w-24 h-0.5 mx-2',
                    currentStep > step.id ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="py-4">
          {/* Step 1: Plan Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Plan Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Premium Access"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What subscribers get..."
                  value={planDescription}
                  onChange={(e) => setPlanDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Monthly Price (USD) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="price"
                    type="number"
                    min="0.99"
                    step="0.01"
                    placeholder="19.99"
                    value={planPrice}
                    onChange={(e) => setPlanPrice(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Minimum price is $0.99. A 5% platform fee applies to all subscriptions.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Review & Confirm */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg border bg-muted/30">
                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Plan Summary
                </h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{planName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price:</span>
                    <span className="font-medium">${parseFloat(planPrice || '0').toFixed(2)}/month</span>
                  </div>
                  {planDescription && (
                    <div className="pt-2 border-t mt-2">
                      <span className="text-muted-foreground block mb-1">Description:</span>
                      <p className="text-sm">{planDescription}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Products can be added to this plan when you create or edit them. 
                  Select "Subscription Only" or "Both" pricing to link products to this plan.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? handleClose : handleBack}
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Button>
          
          {currentStep < 2 ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Create Plan
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
