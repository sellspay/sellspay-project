import { useState, useEffect } from "react";
import { Copy, Check, Zap, Sparkles, MessageSquare, Link2 } from "lucide-react";
import {
  Dialog, DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import referralBlob from "@/assets/referral-blob.png";

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
      <DialogContent className="sm:max-w-[420px] bg-[#0F1115] border-white/10 p-0 gap-0 overflow-hidden rounded-2xl">
        {/* Hero section */}
        <div className="relative px-6 pt-6 pb-4">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white text-sm font-medium mb-4">
            Earn 100+ credits
          </div>

        {/* Blob image */}
        <img
          src={referralBlob}
          alt=""
          aria-hidden="true"
          className="absolute -top-2 right-2 w-36 h-36 object-contain pointer-events-none select-none"
          style={{ filter: 'drop-shadow(0 0 20px rgba(255, 120, 50, 0.3))' }}
        />

          {/* Title */}
          <h2 className="text-[28px] font-bold text-white leading-tight">
            Spread the love
          </h2>
          <p className="text-white/50 text-sm mt-1">and earn free credits</p>
        </div>

        {/* How it works */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-white/60 text-sm font-medium">How it works:</p>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Zap className="h-4 w-4 text-white/70 mt-0.5 shrink-0" />
              <p className="text-white text-sm">Share your invite link</p>
            </div>
            <div className="flex items-start gap-3">
              <Sparkles className="h-4 w-4 text-white/70 mt-0.5 shrink-0" />
              <p className="text-white text-sm">
                They sign up and get <span className="font-bold">extra 10 credits</span>
              </p>
            </div>
            <div className="flex items-start gap-3">
              <MessageSquare className="h-4 w-4 text-white/70 mt-0.5 shrink-0" />
              <p className="text-white text-sm">
                You get <span className="font-bold">100 credits</span> once they subscribe to a paid plan
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        {referralStats.total > 0 && (
          <div className="px-6 pb-3">
            <p className="text-white/50 text-sm">
              {referralStats.total} signed up, {referralStats.rewarded} converted
            </p>
          </div>
        )}

        {/* Link section */}
        <div className="px-6 pb-4">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <Link2 className="h-4 w-4 text-white/40 shrink-0" />
            <span className="text-white/70 text-sm truncate flex-1 font-mono">
              {referralLink || "Loading..."}
            </span>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleCopy}
              disabled={!referralLink}
              className="shrink-0 bg-white/10 hover:bg-white/20 text-white border-0 rounded-lg text-sm px-4"
            >
              {copied ? (
                <><Check className="h-3.5 w-3.5 mr-1.5" /> Copied</>
              ) : (
                <><Copy className="h-3.5 w-3.5 mr-1.5" /> Copy link</>
              )}
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 text-center">
          <button className="text-white/30 text-xs hover:text-white/50 transition-colors underline underline-offset-2">
            View Terms and Conditions
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
