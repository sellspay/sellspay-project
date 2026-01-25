import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Package, Users, DollarSign, Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import CreatePlanWizard from '@/components/subscription/CreatePlanWizard';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  productCount?: number;
  subscriberCount?: number;
}

interface Product {
  id: string;
  name: string;
  cover_image_url: string | null;
  pricing_type: string | null;
  subscription_access: string | null;
  price_cents: number | null;
}

export default function SubscriptionPlans() {
  const { user, profile: authProfile, isAdmin, profileLoading } = useAuth();
  const navigate = useNavigate();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [planProducts, setPlanProducts] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Dialog states
  const [createWizardOpen, setCreateWizardOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [manageProductsDialogOpen, setManageProductsDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  
  // Form states
  const [planName, setPlanName] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [planPrice, setPlanPrice] = useState('');

  // Derive access from centralized auth
  const hasAccess = authProfile?.is_creator || authProfile?.is_seller || isAdmin;

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!profileLoading && authProfile) {
      if (!hasAccess) {
        navigate('/');
        toast.error('You need to be a seller to manage subscription plans');
      }
    }
  }, [user, authProfile, hasAccess, profileLoading, navigate]);

  // Fetch data when authProfile.id is available
  useEffect(() => {
    if (authProfile?.id && hasAccess) {
      setProfileId(authProfile.id);
      fetchDataWithId(authProfile.id);
    }
  }, [authProfile?.id, hasAccess]);

  async function fetchDataWithId(creatorId: string) {
    setLoading(true);
    try {
      // Fetch plans
      const { data: plansData, error: plansError } = await supabase
        .from('creator_subscription_plans')
        .select('*')
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false });
      
      if (plansError) throw plansError;
      
      // Fetch product counts for each plan
      const planIds = plansData?.map(p => p.id) || [];
      const { data: planProductsData } = await supabase
        .from('subscription_plan_products')
        .select('plan_id, product_id')
        .in('plan_id', planIds);
      
      // Count products per plan
      const productCounts: Record<string, number> = {};
      const planProductMap: Record<string, string[]> = {};
      planProductsData?.forEach(pp => {
        productCounts[pp.plan_id] = (productCounts[pp.plan_id] || 0) + 1;
        if (!planProductMap[pp.plan_id]) planProductMap[pp.plan_id] = [];
        planProductMap[pp.plan_id].push(pp.product_id);
      });
      setPlanProducts(planProductMap);
      
      // Fetch subscriber counts
      const { data: subscriptionsData } = await supabase
        .from('user_subscriptions')
        .select('plan_id')
        .in('plan_id', planIds)
        .eq('status', 'active');
      
      const subscriberCounts: Record<string, number> = {};
      subscriptionsData?.forEach(s => {
        subscriberCounts[s.plan_id] = (subscriberCounts[s.plan_id] || 0) + 1;
      });
      
      // Combine data
      const enrichedPlans = plansData?.map(plan => ({
        ...plan,
        productCount: productCounts[plan.id] || 0,
        subscriberCount: subscriberCounts[plan.id] || 0,
      })) || [];
      
      setPlans(enrichedPlans);
      
      // Fetch creator's products
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, cover_image_url, pricing_type, subscription_access, price_cents')
        .eq('creator_id', creatorId)
        .eq('status', 'published');
      
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  }
  // Wrapper function for refetching data
  function fetchData() {
    if (authProfile?.id) {
      fetchDataWithId(authProfile.id);
    }
  }

  // handleCreatePlan is now handled by CreatePlanWizard component

  async function handleUpdatePlan() {
    if (!selectedPlan || !planName.trim() || !planPrice) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setSaving(true);
    try {
      const priceCents = Math.round(parseFloat(planPrice) * 100);
      
      const { error } = await supabase
        .from('creator_subscription_plans')
        .update({
          name: planName.trim(),
          description: planDescription.trim() || null,
          price_cents: priceCents,
        })
        .eq('id', selectedPlan.id);
      
      if (error) throw error;
      
      toast.success('Plan updated!');
      setEditDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error updating plan:', error);
      toast.error('Failed to update plan');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePlan(planId: string) {
    try {
      const { error } = await supabase
        .from('creator_subscription_plans')
        .delete()
        .eq('id', planId);
      
      if (error) throw error;
      
      toast.success('Plan deleted');
      fetchData();
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error('Failed to delete plan');
    }
  }

  async function handleTogglePlanActive(plan: SubscriptionPlan) {
    try {
      const { error } = await supabase
        .from('creator_subscription_plans')
        .update({ is_active: !plan.is_active })
        .eq('id', plan.id);
      
      if (error) throw error;
      
      toast.success(plan.is_active ? 'Plan deactivated' : 'Plan activated');
      fetchData();
    } catch (error) {
      console.error('Error toggling plan:', error);
      toast.error('Failed to update plan');
    }
  }

  async function handleToggleProductInPlan(productId: string) {
    if (!selectedPlan) return;
    
    const currentProducts = planProducts[selectedPlan.id] || [];
    const isInPlan = currentProducts.includes(productId);
    
    try {
      if (isInPlan) {
        // Remove from plan
        const { error } = await supabase
          .from('subscription_plan_products')
          .delete()
          .eq('plan_id', selectedPlan.id)
          .eq('product_id', productId);
        
        if (error) throw error;
        
        // Update product's subscription_access if no longer in any plan
        const { data: remainingPlans } = await supabase
          .from('subscription_plan_products')
          .select('plan_id')
          .eq('product_id', productId);
        
        if (!remainingPlans?.length) {
          await supabase
            .from('products')
            .update({ subscription_access: 'none' })
            .eq('id', productId);
        }
      } else {
        // Add to plan
        const { error } = await supabase
          .from('subscription_plan_products')
          .insert({
            plan_id: selectedPlan.id,
            product_id: productId,
          });
        
        if (error) throw error;
        
        // Update product's subscription_access to 'both' if it was 'none'
        const product = products.find(p => p.id === productId);
        if (product?.subscription_access === 'none') {
          await supabase
            .from('products')
            .update({ subscription_access: 'both' })
            .eq('id', productId);
        }
      }
      
      // Refresh data
      fetchData();
      toast.success(isInPlan ? 'Product removed from plan' : 'Product added to plan');
    } catch (error) {
      console.error('Error updating plan products:', error);
      toast.error('Failed to update plan');
    }
  }

  function resetForm() {
    setPlanName('');
    setPlanDescription('');
    setPlanPrice('');
    setSelectedPlan(null);
  }

  function openEditDialog(plan: SubscriptionPlan) {
    setSelectedPlan(plan);
    setPlanName(plan.name);
    setPlanDescription(plan.description || '');
    setPlanPrice((plan.price_cents / 100).toFixed(2));
    setEditDialogOpen(true);
  }

  function openManageProductsDialog(plan: SubscriptionPlan) {
    setSelectedPlan(plan);
    setManageProductsDialogOpen(true);
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Subscription Plans</h1>
            <p className="text-muted-foreground mt-1">
              Create subscription tiers for your fans to unlock exclusive content
            </p>
          </div>
          
          <Button className="gap-2" onClick={() => setCreateWizardOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Plan
          </Button>
        </div>

        {plans.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No subscription plans yet</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                Create your first subscription plan to offer exclusive access to your content for a monthly fee.
              </p>
              <Button onClick={() => setCreateWizardOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Plan
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id} className={!plan.is_active ? 'opacity-60' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <CardDescription className="mt-1">
                        ${(plan.price_cents / 100).toFixed(2)}/month
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={plan.is_active}
                        onCheckedChange={() => handleTogglePlanActive(plan)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {plan.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {plan.description}
                    </p>
                  )}
                  
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Package className="h-4 w-4" />
                      <span>{plan.productCount} products</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{plan.subscriberCount} subscribers</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openManageProductsDialog(plan)}
                    >
                      <Package className="h-4 w-4 mr-1.5" />
                      Products
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(plan)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Plan?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this subscription plan. Active subscribers will lose access.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeletePlan(plan.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Plan Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Plan</DialogTitle>
              <DialogDescription>
                Update your subscription plan details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Plan Name *</Label>
                <Input
                  id="edit-name"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={planDescription}
                  onChange={(e) => setPlanDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-price">Monthly Price (USD) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="edit-price"
                    type="number"
                    min="0.99"
                    step="0.01"
                    value={planPrice}
                    onChange={(e) => setPlanPrice(e.target.value)}
                    className="pl-7"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setEditDialogOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleUpdatePlan} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Manage Products Dialog */}
        <Dialog open={manageProductsDialogOpen} onOpenChange={setManageProductsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Manage Plan Products</DialogTitle>
              <DialogDescription>
                Select which products are included in "{selectedPlan?.name}"
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {products.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  You don't have any published products yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {products.map((product) => {
                    const isInPlan = selectedPlan && (planProducts[selectedPlan.id] || []).includes(product.id);
                    
                    return (
                      <div
                        key={product.id}
                        className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-colors ${
                          isInPlan ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                        }`}
                        onClick={() => handleToggleProductInPlan(product.id)}
                      >
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
                          <p className="text-sm text-muted-foreground capitalize">
                            {product.pricing_type || 'Free'}
                          </p>
                        </div>
                        <Badge variant={isInPlan ? 'default' : 'outline'}>
                          {isInPlan ? 'Included' : 'Add'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Plan Wizard */}
        {profileId && (
          <CreatePlanWizard
            open={createWizardOpen}
            onOpenChange={setCreateWizardOpen}
            creatorId={profileId}
            onSuccess={fetchData}
          />
        )}
      </div>
    </MainLayout>
  );
}
