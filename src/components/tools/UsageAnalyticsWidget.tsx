import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, TrendingDown, Zap, Clock, Coins, Image, Music, Video, FileText, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts";

type TimeRange = "7d" | "30d" | "all";

interface UsageStats {
  totalGenerations: number;
  creditsUsed: number;
  favoriteAssets: number;
  totalAssets: number;
  byAction: Record<string, number>;
  recentActivity: { action: string; cost: number; created_at: string }[];
  dailyUsage: { date: string; credits: number; count: number }[];
  prevPeriodCredits: number;
}

const TOOL_CATEGORIES: Record<string, { label: string; icon: typeof Image; color: string }> = {
  image: { label: "Image", icon: Image, color: "text-violet-500" },
  audio: { label: "Audio", icon: Music, color: "text-emerald-500" },
  video: { label: "Video", icon: Video, color: "text-blue-500" },
  text: { label: "Text", icon: FileText, color: "text-amber-500" },
};

function categorizeAction(action: string): string {
  const a = action.toLowerCase();
  if (a.includes("image") || a.includes("nano") || a.includes("thumbnail") || a.includes("banner")) return "image";
  if (a.includes("audio") || a.includes("sfx") || a.includes("music") || a.includes("voice") || a.includes("waveform")) return "audio";
  if (a.includes("video") || a.includes("frame") || a.includes("promo")) return "video";
  return "text";
}

export function UsageAnalyticsWidget() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<TimeRange>("30d");

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      setLoading(true);

      const now = new Date();
      const daysMap: Record<TimeRange, number | null> = { "7d": 7, "30d": 30, "all": null };
      const days = daysMap[range];
      const since = days ? new Date(now.getTime() - days * 86400000).toISOString() : undefined;
      const prevSince = days ? new Date(now.getTime() - days * 2 * 86400000).toISOString() : undefined;

      // Fetch usage logs
      let query = supabase
        .from("ai_usage_logs")
        .select("action, final_credits_deducted, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(500);

      if (since) query = query.gte("created_at", since);

      const { data: logs } = await query;

      // Fetch previous period for trend
      let prevCredits = 0;
      if (since && prevSince) {
        const { data: prevLogs } = await supabase
          .from("ai_usage_logs")
          .select("final_credits_deducted")
          .eq("user_id", user.id)
          .gte("created_at", prevSince)
          .lt("created_at", since)
          .limit(500);

        prevCredits = (prevLogs || []).reduce((sum: number, l: any) => sum + (l.final_credits_deducted || 0), 0);
      }

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
      const dailyMap: Record<string, { credits: number; count: number }> = {};

      for (const item of items) {
        byAction[item.action] = (byAction[item.action] || 0) + 1;
        creditsUsed += item.final_credits_deducted;

        const day = item.created_at.slice(0, 10);
        if (!dailyMap[day]) dailyMap[day] = { credits: 0, count: 0 };
        dailyMap[day].credits += item.final_credits_deducted;
        dailyMap[day].count += 1;
      }

      // Fill in missing days for smooth chart
      const dailyUsage: { date: string; credits: number; count: number }[] = [];
      const chartDays = days || 30;
      for (let i = chartDays - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const key = d.toISOString().slice(0, 10);
        dailyUsage.push({
          date: key,
          credits: dailyMap[key]?.credits || 0,
          count: dailyMap[key]?.count || 0,
        });
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
        dailyUsage,
        prevPeriodCredits: prevCredits,
      });
      setLoading(false);
    };
    fetchStats();
  }, [user, range]);

  const categoryBreakdown = useMemo(() => {
    if (!stats) return [];
    const cats: Record<string, number> = {};
    for (const [action, count] of Object.entries(stats.byAction)) {
      const cat = categorizeAction(action);
      cats[cat] = (cats[cat] || 0) + count;
    }
    return Object.entries(cats)
      .map(([key, count]) => ({ key, count, ...(TOOL_CATEGORIES[key] || TOOL_CATEGORIES.text) }))
      .sort((a, b) => b.count - a.count);
  }, [stats]);

  const creditsTrend = useMemo(() => {
    if (!stats || stats.prevPeriodCredits === 0) return null;
    const diff = ((stats.creditsUsed - stats.prevPeriodCredits) / stats.prevPeriodCredits) * 100;
    return Math.round(diff);
  }, [stats]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="h-32 rounded-xl" />
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

  const ranges: { value: TimeRange; label: string }[] = [
    { value: "7d", label: "7 days" },
    { value: "30d", label: "30 days" },
    { value: "all", label: "All time" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-5 space-y-5"
    >
      {/* Header with range selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Usage Analytics</h3>
          {creditsTrend !== null && (
            <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
              creditsTrend > 0 ? "bg-red-500/10 text-red-500" :
              creditsTrend < 0 ? "bg-emerald-500/10 text-emerald-500" :
              "bg-muted text-muted-foreground"
            }`}>
              {creditsTrend > 0 ? <TrendingUp className="h-2.5 w-2.5" /> :
               creditsTrend < 0 ? <TrendingDown className="h-2.5 w-2.5" /> :
               <Minus className="h-2.5 w-2.5" />}
              {Math.abs(creditsTrend)}%
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
          {ranges.map(r => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-all ${
                range === r.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="rounded-xl border border-border bg-muted/30 p-3 text-center space-y-1">
              <Icon className={`h-4 w-4 mx-auto ${s.color}`} />
              <p className="text-lg font-bold text-foreground tabular-nums">{s.value.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Daily usage sparkline */}
      {stats.dailyUsage.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Daily Credits Spent</p>
          <div className="h-28 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.dailyUsage} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                <defs>
                  <linearGradient id="creditGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tickFormatter={(v: string) => v.slice(5)}
                  tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                  labelFormatter={(v: string) => v}
                  formatter={(value: number, name: string) => [
                    value,
                    name === "credits" ? "Credits" : "Generations",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="credits"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#creditGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Category breakdown */}
      {categoryBreakdown.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">By Category</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {categoryBreakdown.map(cat => {
              const Icon = cat.icon;
              return (
                <div key={cat.key} className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2">
                  <Icon className={`h-3.5 w-3.5 ${cat.color}`} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground tabular-nums">{cat.count}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider truncate">{cat.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                <span className="text-[11px] font-medium text-foreground w-6 text-right tabular-nums">{count}</span>
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
                  <span className="text-amber-500 font-medium tabular-nums">-{item.cost}</span>
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
