import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Package, ChevronLeft, ChevronRight, Check, Percent, Gift, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  cover_image_url: string | null;
  pricing_type: string | null;
  price_cents: number | null;
}

interface ProductConfig {
  productId: string;
  isFree: boolean;
  discountPercent: number | null;
}

interface CreatePlanWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creatorId: string;
  products: Product[];
  onSuccess: () => void;
}

const STEPS = [
  { id: 1, name: 'Plan Details', description: 'Name, description & price' },
  { id: 2, name: 'Select Products', description: 'Choose products & discounts' },
  { id: 3, name: 'Review & Confirm', description: 'Verify your plan' },
];

export default function CreatePlanWizard({
  open,
  onOpenChange,
  creatorId,
  products,
  onSuccess,
}: CreatePlanWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  
  // Step 1: Plan details
  const [planName, setPlanName] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [planPrice, setPlanPrice] = useState('');
  
  // Step 2: Product selection with discounts
  const [selectedProducts, setSelectedProducts] = useState<ProductConfig[]>([]);
  const [bulkDiscount, setBulkDiscount] = useState<number | null>(null);
  const [bulkFree, setBulkFree] = useState(false);

  const resetForm = () => {
    setCurrentStep(1);
    setPlanName('');
    setPlanDescription('');
    setPlanPrice('');
    setSelectedProducts([]);
    setBulkDiscount(null);
    setBulkFree(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(resetForm, 300);
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => {
      const exists = prev.find(p => p.productId === productId);
      if (exists) {
        return prev.filter(p => p.productId !== productId);
      }
      return [...prev, { productId, isFree: false, discountPercent: null }];
    });
  };

  const updateProductConfig = (productId: string, updates: Partial<ProductConfig>) => {
    setSelectedProducts(prev =>
      prev.map(p => (p.productId === productId ? { ...p, ...updates } : p))
    );
  };

  const applyBulkSettings = () => {
    if (selectedProducts.length === 0) return;
    
    setSelectedProducts(prev =>
      prev.map(p => ({
        ...p,
        isFree: bulkFree,
        discountPercent: bulkFree ? null : bulkDiscount,
      }))
    );
    toast.success('Bulk settings applied to all selected products');
  };

  const canProceed = () => {
    if (currentStep === 1) {
      return planName.trim() && planPrice && parseFloat(planPrice) >= 0.99;
    }
    if (currentStep === 2) {
      return selectedProducts.length > 0;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep < 3 && canProceed()) {
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

      // Create the plan
      const { data: planData, error: planError } = await supabase
        .from('creator_subscription_plans')
        .insert({
          creator_id: creatorId,
          name: planName.trim(),
          description: planDescription.trim() || null,
          price_cents: priceCents,
          currency: 'USD',
        })
        .select('id')
        .single();

      if (planError) throw planError;

      // Add products to the plan with their discount settings
      if (selectedProducts.length > 0 && planData?.id) {
        const planProductsToInsert = selectedProducts.map(p => ({
          plan_id: planData.id,
          product_id: p.productId,
          is_free: p.isFree,
          discount_percent: p.isFree ? null : p.discountPercent,
          discount_type: p.isFree ? 'free' : p.discountPercent ? 'percentage' : null,
        }));

        const { error: productsError } = await supabase
          .from('subscription_plan_products')
          .insert(planProductsToInsert);

        if (productsError) throw productsError;

        // Update products' subscription_access
        const productIds = selectedProducts.map(p => p.productId);
        await supabase
          .from('products')
          .update({ subscription_access: 'both' })
          .in('id', productIds);
      }

      toast.success('Subscription plan created successfully!');
      handleClose();
      onSuccess();
    } catch (error) {
      console.error('Error creating plan:', error);
      toast.error('Failed to create subscription plan');
    } finally {
      setSaving(false);
    }
  };

  const getProductById = (productId: string) => products.find(p => p.id === productId);

  const formatPrice = (cents: number | null) => {
    if (!cents) return 'Free';
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Create Subscription Plan</DialogTitle>
          <DialogDescription>
            Set up a new subscription tier for your audience
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-between px-2 py-4">
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
        <div className="flex-1 overflow-y-auto py-4 px-1">
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
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="price"
                    type="number"
                    min="0.99"
                    step="0.01"
                    placeholder="19.99"
                    value={planPrice}
                    onChange={(e) => setPlanPrice(e.target.value)}
                    className="pl-7"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Minimum price is $0.99. A 5% platform fee applies to all subscriptions.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Product Selection */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {/* Bulk Actions */}
              <div className="p-4 rounded-lg border bg-muted/30">
                <h4 className="font-medium mb-3">Bulk Actions</h4>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="bulk-free"
                      checked={bulkFree}
                      onCheckedChange={(checked) => {
                        setBulkFree(checked);
                        if (checked) setBulkDiscount(null);
                      }}
                    />
                    <Label htmlFor="bulk-free" className="text-sm">Make all free</Label>
                  </div>
                  {!bulkFree && (
                    <div className="flex items-center gap-2">
                      <Label htmlFor="bulk-discount" className="text-sm">Discount %</Label>
                      <Input
                        id="bulk-discount"
                        type="number"
                        min="0"
                        max="100"
                        placeholder="0"
                        value={bulkDiscount || ''}
                        onChange={(e) => setBulkDiscount(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-20"
                      />
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={applyBulkSettings}
                    disabled={selectedProducts.length === 0}
                  >
                    Apply to Selected
                  </Button>
                </div>
              </div>

              {/* Products List */}
              <div className="space-y-2">
                <Label>Select Products ({selectedProducts.length} selected)</Label>
                {products.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    You don't have any published products yet.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {products.map((product) => {
                      const config = selectedProducts.find(p => p.productId === product.id);
                      const isSelected = !!config;

                      return (
                        <div
                          key={product.id}
                          className={cn(
                            'rounded-lg border p-3 transition-colors',
                            isSelected ? 'border-primary bg-primary/5' : 'border-border'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleProductSelection(product.id)}
                              className="mt-1"
                            />
                            <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                              {product.cover_image_url ? (
                                <img
                                  src={product.cover_image_url}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{product.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Original: {formatPrice(product.price_cents)}
                              </p>
                            </div>
                          </div>

                          {/* Individual product settings */}
                          {isSelected && config && (
                            <div className="mt-3 ml-8 flex flex-wrap items-center gap-4 pt-3 border-t">
                              <div className="flex items-center gap-2">
                                <Switch
                                  id={`free-${product.id}`}
                                  checked={config.isFree}
                                  onCheckedChange={(checked) =>
                                    updateProductConfig(product.id, {
                                      isFree: checked,
                                      discountPercent: checked ? null : config.discountPercent,
                                    })
                                  }
                                />
                                <Label htmlFor={`free-${product.id}`} className="text-sm flex items-center gap-1">
                                  <Gift className="h-3.5 w-3.5" />
                                  Free
                                </Label>
                              </div>
                              {!config.isFree && (
                                <div className="flex items-center gap-2">
                                  <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    placeholder="Discount %"
                                    value={config.discountPercent || ''}
                                    onChange={(e) =>
                                      updateProductConfig(product.id, {
                                        discountPercent: e.target.value ? parseInt(e.target.value) : null,
                                      })
                                    }
                                    className="w-24 h-8"
                                  />
                                </div>
                              )}
                              {config.isFree && (
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                  Free for subscribers
                                </Badge>
                              )}
                              {!config.isFree && config.discountPercent && (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                  {config.discountPercent}% off
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Review & Confirm */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Plan Summary */}
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
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Description:</span>
                      <span className="font-medium text-right max-w-[200px] truncate">{planDescription}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Products Summary */}
              <div className="p-4 rounded-lg border bg-muted/30">
                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Included Products ({selectedProducts.length})
                </h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {selectedProducts.map((config) => {
                    const product = getProductById(config.productId);
                    if (!product) return null;
                    
                    return (
                      <div
                        key={config.productId}
                        className="flex items-center justify-between p-2 rounded bg-background"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-muted overflow-hidden">
                            {product.cover_image_url ? (
                              <img
                                src={product.cover_image_url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <span className="text-sm font-medium">{product.name}</span>
                        </div>
                        <div>
                          {config.isFree ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              Free
                            </Badge>
                          ) : config.discountPercent ? (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              {config.discountPercent}% off
                            </Badge>
                          ) : (
                            <Badge variant="outline">Full price</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Platform Fee Notice */}
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                <strong>Note:</strong> A 5% platform fee will be deducted from each subscription payment.
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? handleClose : handleBack}
            disabled={saving}
          >
            {currentStep === 1 ? (
              'Cancel'
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </>
            )}
          </Button>
          
          {currentStep < 3 ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create Plan
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
