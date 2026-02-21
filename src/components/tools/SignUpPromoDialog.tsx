import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Zap, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SignUpPromoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignUpPromoDialog({ open, onOpenChange }: SignUpPromoDialogProps) {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-md p-0 overflow-hidden">
        {/* Gradient accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-primary via-violet-500 to-fuchsia-500" />
        
        <div className="p-6 pt-5">
          <DialogHeader className="text-center space-y-3">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-violet-500/20 border border-primary/20 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <DialogTitle className="text-xl font-bold">
              Create an account to generate
            </DialogTitle>
            <DialogDescription className="text-zinc-400 leading-relaxed">
              Sign up now and get{" "}
              <span className="text-primary font-semibold">10 free credits</span>{" "}
              to start creating with our AI tools.
            </DialogDescription>
          </DialogHeader>

          {/* Credit promo highlight */}
          <div className="mt-5 p-3.5 rounded-xl bg-primary/5 border border-primary/15 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">10 free credits</p>
              <p className="text-xs text-zinc-500">Enough to try multiple tools — no card required</p>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 mt-6">
            <Button
              onClick={() => {
                onOpenChange(false);
                navigate("/signup?promo=tools10&next=" + encodeURIComponent(window.location.pathname));
              }}
              className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Sign Up Free
              <ArrowRight size={16} />
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                onOpenChange(false);
                navigate("/login?next=" + encodeURIComponent(window.location.pathname));
              }}
              className="w-full text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              Already have an account? Sign In
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
