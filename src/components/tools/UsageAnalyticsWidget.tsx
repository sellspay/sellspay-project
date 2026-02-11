import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Zap, Clock, Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";

interface UsageStats {
  totalGenerations: number;
  creditsUsed: number;
  favoriteAssets: number;
  totalAssets: number;
  byAction: Record<string, number>;
  recentActivity: { action: string; cost: number; created_at: string }[];
}

export function UsageAnalyticsWidget() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      setLoading(true);

      // Fetch usage logs
      const { data: logs } = await supabase
        .from("ai_usage_logs")
        .select("action, final_credits_deducted, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);

      // Fetch asset counts
      const { count: totalAssets } = await supabase
        .from("tool_assets" as any)
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      const { count: favoriteAssets } = await supabase
        .from("tool_assets" as any)
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_favorite", true);

      const items = (logs || []) as { action: string; final_credits_deducted: number; created_at: string }[];

      const byAction: Record<string, number> = {};
      let creditsUsed = 0;
      for (const item of items) {
        byAction[item.action] = (byAction[item.action] || 0) + 1;
        creditsUsed += item.final_credits_deducted;
      }

      setStats({
        totalGenerations: items.length,
        creditsUsed,
        favoriteAssets: favoriteAssets || 0,
        totalAssets: totalAssets || 0,
        byAction,
        recentActivity: items.slice(0, 5).map(i => ({
          action: i.action,
          cost: i.final_credits_deducted,
          created_at: i.created_at,
        })),
      });
      setLoading(false);
    };
    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    { label: "Generations", value: stats.totalGenerations, icon: Zap, color: "text-blue-500" },
    { label: "Credits Used", value: stats.creditsUsed, icon: Coins, color: "text-amber-500" },
    { label: "Total Assets", value: stats.totalAssets, icon: BarChart3, color: "text-emerald-500" },
    { label: "Favorites", value: stats.favoriteAssets, icon: TrendingUp, color: "text-pink-500" },
  ];

  const topActions = Object.entries(stats.byAction)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const maxCount = topActions.length > 0 ? topActions[0][1] : 1;

  const formatAction = (action: string) =>
    action.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-5 space-y-5"
    >
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Usage Analytics</h3>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="rounded-xl border border-border bg-muted/30 p-3 text-center space-y-1">
              <Icon className={`h-4 w-4 mx-auto ${s.color}`} />
              <p className="text-lg font-bold text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Top tools mini bar chart */}
      {topActions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Most Used Tools</p>
          <div className="space-y-1.5">
            {topActions.map(([action, count]) => (
              <div key={action} className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground w-28 truncate">{formatAction(action)}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / maxCount) * 100}%` }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
                <span className="text-[11px] font-medium text-foreground w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent activity */}
      {stats.recentActivity.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Recent Activity</p>
          <div className="space-y-1">
            {stats.recentActivity.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-[11px] py-1 border-b border-border/50 last:border-0">
                <span className="text-foreground">{formatAction(item.action)}</span>
                <div className="flex items-center gap-3">
                  <span className="text-amber-500 font-medium">-{item.cost}</span>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {formatTime(item.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
