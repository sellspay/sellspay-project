import { useState, useEffect } from "react";
import { Copy, Check, Gift, Users, Zap } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReferralDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReferralDialog({ open, onOpenChange }: ReferralDialogProps) {
  const { profile } = useAuth();
  const [copied, setCopied] = useState(false);
  const [referralStats, setReferralStats] = useState({ total: 0, rewarded: 0, earned: 0 });

  const referralCode = profile?.referral_code || "";
  const referralLink = referralCode
    ? `${window.location.origin}/signup?ref=${referralCode}`
    : "";

  useEffect(() => {
    if (!open || !profile?.user_id) return;
    
    const fetchStats = async () => {
      const { data, error } = await supabase
        .from("referrals")
        .select("status, reward_credits")
        .eq("referrer_id", profile.user_id);

      if (!error && data) {
        setReferralStats({
          total: data.length,
          rewarded: data.filter(r => r.status === "rewarded").length,
          earned: data.filter(r => r.status === "rewarded").reduce((sum, r) => sum + (r.reward_credits || 0), 0),
        });
      }
    };
    fetchStats();
  }, [open, profile?.user_id]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Gift className="h-5 w-5 text-primary" />
            Get Free Credits
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* How it works */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Share your link — when a friend signs up and uses a tool, you both get free credits!
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-xl bg-muted/50 border border-border">
                <span className="text-lg font-bold text-foreground">1</span>
                <p className="text-[11px] text-muted-foreground mt-1">Share link</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-muted/50 border border-border">
                <span className="text-lg font-bold text-foreground">2</span>
                <p className="text-[11px] text-muted-foreground mt-1">Friend signs up</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-muted/50 border border-border">
                <span className="text-lg font-bold text-foreground">3</span>
                <p className="text-[11px] text-muted-foreground mt-1">Both earn credits</p>
              </div>
            </div>
          </div>

          {/* Rewards breakdown */}
          <div className="flex gap-3">
            <div className="flex-1 p-3 rounded-xl bg-primary/10 border border-primary/20">
              <p className="text-xs text-muted-foreground">You earn</p>
              <p className="text-lg font-bold text-primary">5 credits</p>
            </div>
            <div className="flex-1 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-xs text-muted-foreground">Friend gets</p>
              <p className="text-lg font-bold text-emerald-400">3 credits</p>
            </div>
          </div>

          {/* Shareable link */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Your referral link
            </label>
            <div className="flex gap-2">
              <div className="flex-1 px-3 py-2.5 rounded-lg bg-muted border border-border text-sm text-foreground truncate font-mono">
                {referralLink || "Loading..."}
              </div>
              <Button
                size="sm"
                onClick={handleCopy}
                disabled={!referralLink}
                className="shrink-0 gap-1.5"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          {/* Stats */}
          {referralStats.total > 0 && (
            <div className="pt-3 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{referralStats.total} referred</span>
                </div>
                <div className="flex items-center gap-2 text-primary">
                  <Zap className="h-4 w-4" />
                  <span className="font-semibold">{referralStats.earned} credits earned</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
