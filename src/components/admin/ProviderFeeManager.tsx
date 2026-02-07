import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { CreditCard, Wallet, Globe, Save, RefreshCw, DollarSign, Percent, Shield, TrendingUp } from "lucide-react";
import { ProviderFeeSettings, calculatePayoutEstimate, formatCents } from "@/lib/payoutCalculator";
import { useAuth } from "@/lib/auth";

const PROVIDER_ICONS: Record<string, React.ElementType> = {
  stripe: CreditCard,
  paypal: Wallet,
  payoneer: Globe,
};

const PROVIDER_COLORS: Record<string, string> = {
  stripe: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  paypal: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  payoneer: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

export function ProviderFeeManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ProviderFeeSettings>>({});
  const [testPrice, setTestPrice] = useState<number>(1000); // $10.00 default

  const { data: providers = [], isLoading, refetch } = useQuery({
    queryKey: ["provider-fee-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_fee_settings")
        .select("*")
        .order("provider_name");
      if (error) throw error;
      return data as ProviderFeeSettings[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: { id: string; data: Partial<ProviderFeeSettings>; providerName: string }) => {
      const { error } = await supabase
        .from("provider_fee_settings")
        .update(updates.data)
        .eq("id", updates.id);
      if (error) throw error;

      // Log to audit
      if (user?.id) {
        await supabase.from("admin_audit_log").insert([{
          admin_user_id: user.id,
          action_type: "provider_fee_updated",
          target_type: "provider_fee_settings",
          target_id: updates.id,
          new_value: JSON.parse(JSON.stringify(updates.data)),
          notes: `Updated ${updates.providerName} fee settings`,
        }]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-fee-settings"] });
      toast.success("Provider fee settings updated");
      setEditingId(null);
      setEditForm({});
    },
    onError: (error) => {
      console.error("Error updating provider:", error);
      toast.error("Failed to update provider settings");
    },
  });

  const handleEdit = (provider: ProviderFeeSettings) => {
    setEditingId(provider.id);
    setEditForm({
      fixed_fee_cents: provider.fixed_fee_cents,
      percentage_fee: provider.percentage_fee,
      cross_border_surcharge: provider.cross_border_surcharge,
      safety_buffer: provider.safety_buffer,
      is_active: provider.is_active,
      notes: provider.notes,
    });
  };

  const handleSave = () => {
    if (!editingId) return;
    const provider = providers.find((p) => p.id === editingId);
    updateMutation.mutate({ id: editingId, data: editForm, providerName: provider?.provider_name || "provider" });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  // Calculate comparison for all providers
  const getComparison = (provider: ProviderFeeSettings) => {
    return calculatePayoutEstimate(testPrice, 10, provider, false); // Using 10% platform fee for comparison
  };

  // Find cheapest provider
  const cheapestProvider = providers
    .filter((p) => p.is_active)
    .reduce<ProviderFeeSettings | null>((cheapest, current) => {
      if (!cheapest) return current;
      const cheapestPayout = getComparison(cheapest).estimated_payout_cents;
      const currentPayout = getComparison(current).estimated_payout_cents;
      return currentPayout > cheapestPayout ? current : cheapest;
    }, null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Provider Fee Control Center
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage payout provider fees and see real-time seller payout estimates
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Provider Cards Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {providers.map((provider) => {
          const Icon = PROVIDER_ICONS[provider.provider_key] || CreditCard;
          const isEditing = editingId === provider.id;
          const colorClass = PROVIDER_COLORS[provider.provider_key] || "bg-muted text-muted-foreground";
          const comparison = getComparison(provider);
          const isCheapest = cheapestProvider?.id === provider.id;

          return (
            <Card
              key={provider.id}
              className={`relative transition-all ${!provider.is_active ? "opacity-60" : ""} ${
                isEditing ? "ring-2 ring-primary" : ""
              }`}
            >
              {isCheapest && provider.is_active && (
                <Badge className="absolute -top-2 -right-2 bg-green-500 text-white">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Best Value
                </Badge>
              )}

              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{provider.provider_name}</CardTitle>
                      <CardDescription className="text-xs">
                        Updated {new Date(provider.updated_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                  {isEditing ? (
                    <Switch
                      checked={editForm.is_active ?? provider.is_active}
                      onCheckedChange={(checked) => setEditForm({ ...editForm, is_active: checked })}
                    />
                  ) : (
                    <Badge variant={provider.is_active ? "default" : "secondary"}>
                      {provider.is_active ? "Active" : "Disabled"}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {isEditing ? (
                  /* Edit Mode */
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Fixed Fee (cents)</Label>
                        <Input
                          type="number"
                          value={editForm.fixed_fee_cents ?? ""}
                          onChange={(e) =>
                            setEditForm({ ...editForm, fixed_fee_cents: parseInt(e.target.value) || 0 })
                          }
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Percentage (%)</Label>
                        <Input
                          type="number"
                          step="0.001"
                          value={editForm.percentage_fee ?? ""}
                          onChange={(e) =>
                            setEditForm({ ...editForm, percentage_fee: parseFloat(e.target.value) || 0 })
                          }
                          className="h-8"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Cross-Border (%)</Label>
                        <Input
                          type="number"
                          step="0.001"
                          value={editForm.cross_border_surcharge ?? ""}
                          onChange={(e) =>
                            setEditForm({ ...editForm, cross_border_surcharge: parseFloat(e.target.value) || 0 })
                          }
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Safety Buffer (%)</Label>
                        <Input
                          type="number"
                          step="0.001"
                          value={editForm.safety_buffer ?? ""}
                          onChange={(e) =>
                            setEditForm({ ...editForm, safety_buffer: parseFloat(e.target.value) || 0 })
                          }
                          className="h-8"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Notes</Label>
                      <Textarea
                        value={editForm.notes ?? ""}
                        onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                        className="h-16 text-xs"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
                        <Save className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancel}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Fixed:</span>
                        <span className="font-mono">{formatCents(provider.fixed_fee_cents)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Percent className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Rate:</span>
                        <span className="font-mono">{provider.percentage_fee}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">X-Border:</span>
                        <span className="font-mono">{provider.cross_border_surcharge}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Buffer:</span>
                        <span className="font-mono">{provider.safety_buffer}%</span>
                      </div>
                    </div>

                    {provider.notes && (
                      <p className="text-xs text-muted-foreground border-t pt-2">{provider.notes}</p>
                    )}

                    <div className="border-t pt-3">
                      <p className="text-xs text-muted-foreground mb-1">Est. payout on {formatCents(testPrice)}:</p>
                      <p className="text-lg font-bold text-green-500">
                        {formatCents(comparison.estimated_payout_cents)}
                      </p>
                    </div>

                    <Button size="sm" variant="outline" className="w-full" onClick={() => handleEdit(provider)}>
                      Edit Settings
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Provider Comparison</CardTitle>
              <CardDescription>Side-by-side fee breakdown for a sample transaction</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm">Test Price:</Label>
              <div className="relative w-32">
                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={testPrice / 100}
                  onChange={(e) => setTestPrice(Math.round(parseFloat(e.target.value) * 100) || 0)}
                  className="pl-7 h-8"
                  step="0.01"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">Platform (10%)</TableHead>
                <TableHead className="text-right">Fixed Fee</TableHead>
                <TableHead className="text-right">% Fee</TableHead>
                <TableHead className="text-right">Buffer</TableHead>
                <TableHead className="text-right font-semibold">Seller Gets</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers
                .filter((p) => p.is_active)
                .map((provider) => {
                  const estimate = getComparison(provider);
                  const isCheapest = cheapestProvider?.id === provider.id;

                  return (
                    <TableRow key={provider.id} className={isCheapest ? "bg-green-500/10" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const Icon = PROVIDER_ICONS[provider.provider_key] || CreditCard;
                            return <Icon className="h-4 w-4 text-muted-foreground" />;
                          })()}
                          {provider.provider_name}
                          {isCheapest && (
                            <Badge variant="outline" className="text-green-500 border-green-500 text-xs">
                              Best
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">{formatCents(estimate.gross_amount_cents)}</TableCell>
                      <TableCell className="text-right font-mono text-red-400">
                        -{formatCents(estimate.platform_fee_cents)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-orange-400">
                        -{formatCents(estimate.provider_fixed_fee_cents)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-orange-400">
                        -{formatCents(estimate.provider_percentage_fee_cents)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-yellow-400">
                        -{formatCents(estimate.safety_buffer_cents)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-green-500">
                        {formatCents(estimate.estimated_payout_cents)}
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
