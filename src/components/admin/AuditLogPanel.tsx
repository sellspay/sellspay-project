import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Search, User, Calendar } from "lucide-react";
import { format } from "date-fns";

type AuditLogEntry = {
  id: string;
  admin_user_id: string;
  action_type: string;
  target_type: string | null;
  target_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  notes: string | null;
  ip_address: string | null;
  created_at: string | null;
};

const ACTION_COLORS: Record<string, string> = {
  payout_approved: "bg-green-500/20 text-green-400 border-green-500/30",
  payout_denied: "bg-red-500/20 text-red-400 border-red-500/30",
  payout_processed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  seller_restricted: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  seller_suspended: "bg-red-500/20 text-red-400 border-red-500/30",
  country_updated: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  dispute_resolved: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  user_verified: "bg-green-500/20 text-green-400 border-green-500/30",
};

export function AuditLogPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["admin-audit-log", actionFilter],
    queryFn: async () => {
      let query = supabase
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (actionFilter !== "all") {
        query = query.eq("action_type", actionFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AuditLogEntry[];
    },
  });

  const { data: actionTypes = [] } = useQuery({
    queryKey: ["audit-action-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_audit_log")
        .select("action_type")
        .limit(100);
      
      if (error) throw error;
      const uniqueActions = [...new Set(data.map(d => d.action_type))];
      return uniqueActions.sort();
    },
  });

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      log.action_type.toLowerCase().includes(search) ||
      log.target_type?.toLowerCase().includes(search) ||
      log.notes?.toLowerCase().includes(search) ||
      log.target_id?.toLowerCase().includes(search)
    );
  });

  const getActionBadgeClass = (actionType: string) => {
    return ACTION_COLORS[actionType] || "bg-muted text-muted-foreground border-border";
  };

  const formatValue = (value: Record<string, unknown> | null) => {
    if (!value) return null;
    return JSON.stringify(value, null, 2);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[200px] bg-card border-border">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {actionTypes.map((action) => (
              <SelectItem key={action} value={action}>
                {action.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            Admin Audit Log
            <Badge variant="outline" className="ml-2">
              {filteredLogs.length} entries
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading audit logs...
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No audit logs found
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge 
                            variant="outline" 
                            className={getActionBadgeClass(log.action_type)}
                          >
                            {log.action_type.replace(/_/g, " ")}
                          </Badge>
                          {log.target_type && (
                            <Badge variant="secondary" className="text-xs">
                              {log.target_type}
                            </Badge>
                          )}
                        </div>
                        
                        {log.notes && (
                          <p className="text-sm text-foreground">{log.notes}</p>
                        )}
                        
                        {log.target_id && (
                          <p className="text-xs text-muted-foreground font-mono">
                            Target: {log.target_id}
                          </p>
                        )}

                        {(log.old_value || log.new_value) && (
                          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                            {log.old_value && (
                              <div className="bg-red-500/10 border border-red-500/20 rounded p-2">
                                <p className="text-red-400 font-medium mb-1">Previous</p>
                                <pre className="text-muted-foreground overflow-auto max-h-20">
                                  {formatValue(log.old_value)}
                                </pre>
                              </div>
                            )}
                            {log.new_value && (
                              <div className="bg-green-500/10 border border-green-500/20 rounded p-2">
                                <p className="text-green-400 font-medium mb-1">New</p>
                                <pre className="text-muted-foreground overflow-auto max-h-20">
                                  {formatValue(log.new_value)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right text-xs text-muted-foreground space-y-1 shrink-0">
                        <div className="flex items-center gap-1 justify-end">
                          <Calendar className="h-3 w-3" />
                          {log.created_at ? format(new Date(log.created_at), "MMM d, yyyy") : "—"}
                        </div>
                        <div>
                          {log.created_at ? format(new Date(log.created_at), "h:mm a") : ""}
                        </div>
                        {log.ip_address && (
                          <div className="font-mono text-[10px]">{log.ip_address}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
