import { useState, useEffect } from "react";
import { Search, Check, X, Loader2, DollarSign, Clock, Download, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface Payout {
  id: string;
  seller_id: string;
  amount_cents: number;
  currency: string;
  provider_type: string;
  status: string;
  requested_at: string;
  approved_at: string | null;
  sent_at: string | null;
  external_reference: string | null;
  admin_notes: string | null;
  failure_reason: string | null;
  seller?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    seller_mode: string | null;
  };
}

type PayoutStatus = "requested" | "approved" | "processing" | "sent" | "failed" | "cancelled";

const STATUS_CONFIG: Record<PayoutStatus, { label: string; color: string }> = {
  requested: { label: "Pending", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  approved: { label: "Approved", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  processing: { label: "Processing", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  sent: { label: "Sent", color: "bg-green-500/10 text-green-500 border-green-500/20" },
  failed: { label: "Failed", color: "bg-red-500/10 text-red-500 border-red-500/20" },
  cancelled: { label: "Cancelled", color: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
};

export default function PayoutQueue() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("requested");
  const [actionDialog, setActionDialog] = useState<{
    payout: Payout;
    action: "approve" | "deny" | "mark_sent";
  } | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [externalRef, setExternalRef] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    try {
      const { data, error } = await supabase
        .from("payouts")
        .select("*")
        .order("requested_at", { ascending: false });

      if (error) throw error;

      // Fetch seller profiles
      const sellerIds = [...new Set((data || []).map(p => p.seller_id))];
      let sellersMap: Record<string, Payout["seller"]> = {};

      if (sellerIds.length > 0) {
        const { data: sellers } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url, seller_mode")
          .in("id", sellerIds);

        sellers?.forEach(s => {
          sellersMap[s.id] = {
            username: s.username,
            full_name: s.full_name,
            avatar_url: s.avatar_url,
            seller_mode: s.seller_mode,
          };
        });
      }

      const payoutsWithSellers = (data || []).map(p => ({
        ...p,
        seller: sellersMap[p.seller_id] || null,
      }));

      setPayouts(payoutsWithSellers);
    } catch (error) {
      console.error("Error fetching payouts:", error);
      toast.error("Failed to load payouts");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!actionDialog) return;

    setProcessing(true);
    const { payout, action } = actionDialog;

    try {
      let updateData: Record<string, unknown> = {};

      if (action === "approve") {
        updateData = {
          status: "approved",
          approved_at: new Date().toISOString(),
          admin_notes: adminNotes || null,
        };
      } else if (action === "deny") {
        updateData = {
          status: "cancelled",
          admin_notes: adminNotes || "Denied by admin",
        };
      } else if (action === "mark_sent") {
        updateData = {
          status: "sent",
          sent_at: new Date().toISOString(),
          external_reference: externalRef || null,
          admin_notes: adminNotes || null,
        };
      }

      const { error } = await supabase
        .from("payouts")
        .update(updateData)
        .eq("id", payout.id);

      if (error) throw error;

      toast.success(
        action === "approve"
          ? "Payout approved"
          : action === "deny"
          ? "Payout denied"
          : "Payout marked as sent"
      );

      setActionDialog(null);
      setAdminNotes("");
      setExternalRef("");
      fetchPayouts();
    } catch (error) {
      console.error("Error updating payout:", error);
      toast.error("Failed to update payout");
    } finally {
      setProcessing(false);
    }
  };

  const exportCSV = () => {
    const filtered = payouts.filter(p => p.status === statusFilter);
    const csv = [
      ["ID", "Seller", "Amount", "Provider", "Status", "Requested", "Notes"].join(","),
      ...filtered.map(p =>
        [
          p.id,
          p.seller?.username || p.seller_id,
          `$${(p.amount_cents / 100).toFixed(2)}`,
          p.provider_type,
          p.status,
          format(new Date(p.requested_at), "yyyy-MM-dd HH:mm"),
          `"${(p.admin_notes || "").replace(/"/g, '""')}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payouts-${statusFilter}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const filteredPayouts = payouts.filter(p => {
    const matchesStatus = p.status === statusFilter;
    const matchesSearch =
      !search ||
      p.seller?.username?.toLowerCase().includes(search.toLowerCase()) ||
      p.seller?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.id.includes(search);
    return matchesStatus && matchesSearch;
  });

  const stats = {
    pending: payouts.filter(p => p.status === "requested").length,
    approved: payouts.filter(p => p.status === "approved").length,
    pendingAmount: payouts
      .filter(p => p.status === "requested")
      .reduce((sum, p) => sum + p.amount_cents, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">${(stats.pendingAmount / 100).toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Pending Amount</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Check className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.approved}</p>
                <p className="text-sm text-muted-foreground">Ready to Send</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payout Queue */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payout Queue</CardTitle>
              <CardDescription>
                Review and approve seller payout requests. MoR sellers require manual approval.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <div className="flex items-center gap-4 mb-4">
              <TabsList>
                <TabsTrigger value="requested">
                  Pending {stats.pending > 0 && `(${stats.pending})`}
                </TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="sent">Sent</TabsTrigger>
                <TabsTrigger value="failed">Failed</TabsTrigger>
              </TabsList>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search sellers..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Seller</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayouts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No payouts found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayouts.map(payout => (
                      <TableRow key={payout.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={payout.seller?.avatar_url || ""} />
                              <AvatarFallback>
                                {payout.seller?.username?.charAt(0).toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {payout.seller?.full_name || payout.seller?.username || "Unknown"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                @{payout.seller?.username || "—"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono font-semibold">
                          ${(payout.amount_cents / 100).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{payout.provider_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              payout.seller?.seller_mode === "CONNECT"
                                ? "bg-green-500/10 text-green-500 border-green-500/20"
                                : "bg-orange-500/10 text-orange-500 border-orange-500/20"
                            }
                          >
                            {payout.seller?.seller_mode || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(payout.requested_at), "MMM d, yyyy HH:mm")}
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <span className="text-sm text-muted-foreground truncate block">
                            {payout.admin_notes || "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {payout.status === "requested" && (
                              <>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-green-500 hover:text-green-600"
                                  onClick={() =>
                                    setActionDialog({ payout, action: "approve" })
                                  }
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-red-500 hover:text-red-600"
                                  onClick={() => setActionDialog({ payout, action: "deny" })}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {payout.status === "approved" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setActionDialog({ payout, action: "mark_sent" })
                                }
                              >
                                Mark Sent
                              </Button>
                            )}
                            {payout.status === "failed" && (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.action === "approve"
                ? "Approve Payout"
                : actionDialog?.action === "deny"
                ? "Deny Payout"
                : "Mark as Sent"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog?.action === "approve"
                ? "Approve this payout request. The seller will be notified."
                : actionDialog?.action === "deny"
                ? "Deny this payout request. Please provide a reason."
                : "Confirm the payout has been sent. Add the transaction reference."}
            </DialogDescription>
          </DialogHeader>

          {actionDialog && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={actionDialog.payout.seller?.avatar_url || ""} />
                  <AvatarFallback>
                    {actionDialog.payout.seller?.username?.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {actionDialog.payout.seller?.full_name ||
                      actionDialog.payout.seller?.username}
                  </p>
                  <p className="text-lg font-mono font-bold">
                    ${(actionDialog.payout.amount_cents / 100).toFixed(2)} via{" "}
                    {actionDialog.payout.provider_type}
                  </p>
                </div>
              </div>

              {actionDialog.action === "mark_sent" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Transaction Reference</label>
                  <Input
                    placeholder="e.g., PayPal batch ID, Payoneer ref..."
                    value={externalRef}
                    onChange={e => setExternalRef(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Admin Notes</label>
                <Textarea
                  placeholder={
                    actionDialog.action === "deny"
                      ? "Reason for denial..."
                      : "Optional notes..."
                  }
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={processing || (actionDialog?.action === "deny" && !adminNotes)}
              variant={actionDialog?.action === "deny" ? "destructive" : "default"}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {actionDialog?.action === "approve"
                ? "Approve"
                : actionDialog?.action === "deny"
                ? "Deny"
                : "Confirm Sent"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
