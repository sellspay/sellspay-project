import { useState, useEffect } from "react";
import { Copy, Check, Zap, Sparkles, MessageSquare, Link2 } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
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
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[50%] z-50 w-full max-w-[400px] translate-x-[-50%] translate-y-[-50%] rounded-2xl border border-white/[0.08] shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] overflow-hidden"
          style={{ backgroundColor: '#1A1A1F', colorScheme: 'dark' }}
        >
          {/* Close button */}
          <DialogPrimitive.Close className="absolute right-4 top-4 z-10 rounded-sm text-white/40 hover:text-white/70 transition-opacity focus:outline-none">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>

          {/* Hero section with blob */}
          <div className="relative px-6 pt-6 pb-5 overflow-hidden">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.08] text-white/90 text-[13px] font-medium mb-5">
              Earn 100+ credits
            </div>

            {/* Blob image */}
            <div className="absolute -top-4 -right-4 w-40 h-40 pointer-events-none">
              <img
                src={referralBlob}
                alt=""
                aria-hidden="true"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Title */}
            <h2 className="text-[26px] font-bold text-white leading-tight tracking-tight">
              Spread the love
            </h2>
            <p className="text-white/40 text-[13px] mt-1">and earn free credits</p>
          </div>

          {/* How it works */}
          <div className="px-6 pb-5 space-y-4">
            <p className="text-white/50 text-[13px] font-medium">How it works:</p>

            <div className="space-y-3.5">
              <div className="flex items-center gap-3">
                <Zap className="h-[15px] w-[15px] text-white/50 shrink-0" />
                <p className="text-white/90 text-[13px]">Share your invite link</p>
              </div>
              <div className="flex items-center gap-3">
                <Sparkles className="h-[15px] w-[15px] text-white/50 shrink-0" />
                <p className="text-white/90 text-[13px]">
                  They sign up and get <span className="font-semibold text-white">extra 10 credits</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <MessageSquare className="h-[15px] w-[15px] text-white/50 shrink-0" />
                <p className="text-white/90 text-[13px]">
                  You get <span className="font-semibold text-white">100 credits</span> once they subscribe to a paid plan
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          {referralStats.total > 0 && (
            <div className="px-6 pb-3">
              <p className="text-white/40 text-[13px]">
                {referralStats.total} signed up, {referralStats.rewarded} converted
              </p>
            </div>
          )}

          {/* Link + Copy button */}
          <div className="px-6 pb-4">
            <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2.5 flex-1 min-w-0">
                <Link2 className="h-3.5 w-3.5 text-white/30 shrink-0" />
                <span className="text-white/50 text-[12px] truncate font-mono">
                  {referralLink || "Loading..."}
                </span>
              </div>
              <button
                onClick={handleCopy}
                disabled={!referralLink}
                className="shrink-0 px-4 py-2.5 text-[13px] font-medium text-white/90 bg-white/[0.08] hover:bg-white/[0.14] border-l border-white/[0.08] transition-colors disabled:opacity-40"
              >
                {copied ? "Copied!" : "Copy link"}
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-5 text-center">
            <button className="text-white/25 text-[11px] hover:text-white/40 transition-colors underline underline-offset-2">
              View Terms and Conditions
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
