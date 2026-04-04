import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Loader2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import sellspayLogo from "@/assets/sellspay-s-logo-new.png";

interface SignUpPromoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignUpPromoDialog({ open, onOpenChange }: SignUpPromoDialogProps) {
  const navigate = useNavigate();
  const { signInWithGoogle, user } = useAuth();
  const [email, setEmail] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  // Auto-close when user becomes authenticated
  useEffect(() => {
    if (user && open) {
      onOpenChange(false);
    }
  }, [user, open, onOpenChange]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      localStorage.setItem("postAuthRedirect", window.location.pathname);
      await signInWithGoogle();
    } catch {
      setGoogleLoading(false);
    }
  };

  const handleEmailContinue = () => {
    onOpenChange(false);
    const params = new URLSearchParams();
    if (email) params.set("email", email);
    params.set("next", window.location.pathname);
    navigate(`/signup?${params.toString()}`);
  };

  const handleSignIn = () => {
    onOpenChange(false);
    navigate(`/login?next=${encodeURIComponent(window.location.pathname)}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-none text-zinc-900 max-w-[420px] p-0 overflow-hidden rounded-2xl shadow-2xl [&>button]:hidden">
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 z-10 rounded-full p-1 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="px-8 pt-8 pb-7">
          {/* Logo + heading */}
          <div className="text-center mb-6">
            <img src={sellspayLogo} alt="SellsPay" className="w-10 h-10 mx-auto mb-4" />
            <h2 className="text-[22px] font-bold text-zinc-900">Welcome to SellsPay</h2>
            <p className="text-sm text-zinc-500 mt-1">Sign up and start creating for free</p>
          </div>

          {/* Social buttons */}
          <div className="space-y-3 mb-5">
            <button
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 h-11 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-sm font-medium text-zinc-700 transition-colors disabled:opacity-50"
            >
              {googleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              Continue with Google
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-zinc-200" />
            <span className="text-xs text-zinc-400 font-medium">Or use email to sign up</span>
            <div className="flex-1 h-px bg-zinc-200" />
          </div>

          {/* Email input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full h-11 rounded-lg border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
              onKeyDown={(e) => e.key === "Enter" && handleEmailContinue()}
            />
          </div>

          {/* Continue button */}
          <button
            onClick={handleEmailContinue}
            className="w-full h-11 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-semibold transition-all shadow-sm"
          >
            Continue
          </button>

          {/* Sign in link */}
          <p className="text-center text-sm text-zinc-500 mt-5">
            Already have an account?{" "}
            <button onClick={handleSignIn} className="text-zinc-900 font-semibold hover:underline">
              Sign in
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
