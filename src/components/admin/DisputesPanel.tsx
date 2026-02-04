import { useState, useEffect } from "react";
import { AlertTriangle, RefreshCw, ExternalLink, Clock, CheckCircle, XCircle, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DisputedPurchase {
  id: string;
  amount_cents: number;
  creator_payout_cents: number;
  dispute_status: string | null;
  created_at: string;
  product: {
    id: string;
    name: string;
    creator_id: string;
  } | null;
  seller: {
    id: string;
    username: string | null;
    avatar_url: string | null;
  } | null;
  lockedAmount: number;
}

export default function DisputesPanel() {
  const [loading, setLoading] = useState(true);
  const [disputes, setDisputes] = useState<DisputedPurchase[]>([]);
  const [activeTab, setActiveTab] = useState<"active" | "resolved">("active");
  const [stats, setStats] = useState({
    activeCount: 0,
    totalLocked: 0,
    wonCount: 0,
    lostCount: 0,
  });

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      // Fetch purchases with dispute status
      const { data: purchasesData, error: purchasesError } = await supabase
        .from("purchases")
        .select(`
          id,
          amount_cents,
          creator_payout_cents,
          dispute_status,
          created_at,
          product_id,
          products!inner(id, name, creator_id)
        `)
        .not("dispute_status", "is", null)
        .neq("dispute_status", "none")
        .order("created_at", { ascending: false });

      if (purchasesError) throw purchasesError;

      // Get seller profiles
      const creatorIds = [...new Set(purchasesData?.map(p => (p.products as any)?.creator_id).filter(Boolean) || [])];
      let sellersMap: Record<string, { id: string; username: string | null; avatar_url: string | null }> = {};

      if (creatorIds.length > 0) {
        const { data: sellersData } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", creatorIds);

        sellersData?.forEach(s => {
          sellersMap[s.id] = s;
        });
      }

      // Get locked amounts from ledger
      const purchaseIds = purchasesData?.map(p => p.id) || [];
      let lockedMap: Record<string, number> = {};

      if (purchaseIds.length > 0) {
        const { data: ledgerData } = await supabase
          .from("wallet_ledger_entries")
          .select("order_id, amount_cents, status")
          .in("order_id", purchaseIds)
          .eq("entry_type", "chargeback_debit")
          .eq("status", "locked");

        ledgerData?.forEach(l => {
          if (l.order_id) {
            lockedMap[l.order_id] = Math.abs(l.amount_cents);
          }
        });
      }

      const formattedDisputes: DisputedPurchase[] = (purchasesData || []).map(p => ({
        id: p.id,
        amount_cents: p.amount_cents,
        creator_payout_cents: p.creator_payout_cents,
        dispute_status: p.dispute_status,
        created_at: p.created_at,
        product: p.products as any,
        seller: sellersMap[(p.products as any)?.creator_id] || null,
        lockedAmount: lockedMap[p.id] || 0,
      }));

      setDisputes(formattedDisputes);

      // Calculate stats
      const active = formattedDisputes.filter(d => d.dispute_status === "disputed");
      const won = formattedDisputes.filter(d => d.dispute_status === "won");
      const lost = formattedDisputes.filter(d => d.dispute_status === "lost" || d.dispute_status === "refunded");
      const totalLocked = active.reduce((sum, d) => sum + d.lockedAmount, 0);

      setStats({
        activeCount: active.length,
        totalLocked,
        wonCount: won.length,
        lostCount: lost.length,
      });
    } catch (error) {
      console.error("Error fetching disputes:", error);
      toast.error("Failed to load disputes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const formatDate = (date: string) => new Date(date).toLocaleDateString();

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "disputed":
        return <Badge variant="outline" className="border-warning text-warning"><Clock className="w-3 h-3 mr-1" />Active</Badge>;
      case "won":
        return <Badge variant="outline" className="border-primary text-primary"><CheckCircle className="w-3 h-3 mr-1" />Won</Badge>;
      case "lost":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Lost</Badge>;
      case "refunded":
        return <Badge variant="secondary"><DollarSign className="w-3 h-3 mr-1" />Refunded</Badge>;
      default:
        return <Badge variant="outline">{status || "Unknown"}</Badge>;
    }
  };

  const activeDisputes = disputes.filter(d => d.dispute_status === "disputed");
  const resolvedDisputes = disputes.filter(d => d.dispute_status !== "disputed");
  const currentDisputes = activeTab === "active" ? activeDisputes : resolvedDisputes;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.activeCount}</p>
                <p className="text-xs text-muted-foreground">Active Disputes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <DollarSign className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalLocked)}</p>
                <p className="text-xs text-muted-foreground">Locked Funds</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <CheckCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.wonCount}</p>
                <p className="text-xs text-muted-foreground">Won</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <XCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.lostCount}</p>
                <p className="text-xs text-muted-foreground">Lost</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Disputes Table */}
      <Card className="bg-card/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Disputes & Chargebacks
              </CardTitle>
              <CardDescription>Manage payment disputes and refunds</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchDisputes} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "active" | "resolved")}>
            <TabsList className="mb-4">
              <TabsTrigger value="active" className="gap-2">
                Active
                {stats.activeCount > 0 && (
                  <Badge variant="outline" className="border-warning text-warning ml-1">{stats.activeCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
            </TabsList>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Amount</TableHead>
                  {activeTab === "active" && <TableHead>Locked</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-16">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentDisputes.map((dispute) => (
                  <TableRow key={dispute.id}>
                    <TableCell>
                      <span className="font-medium truncate max-w-[200px] block">
                        {dispute.product?.name || "Unknown Product"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={dispute.seller?.avatar_url || undefined} />
                          <AvatarFallback>{dispute.seller?.username?.[0] || "?"}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">@{dispute.seller?.username || "unknown"}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(dispute.amount_cents)}</TableCell>
                    {activeTab === "active" && (
                      <TableCell>
                        <span className="text-destructive font-medium">
                          {formatCurrency(dispute.lockedAmount)}
                        </span>
                      </TableCell>
                    )}
                    <TableCell>{getStatusBadge(dispute.dispute_status)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(dispute.created_at)}</TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => window.open(`/products/${dispute.product?.id}`, "_blank")}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {currentDisputes.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No {activeTab} disputes found</p>
              </div>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
