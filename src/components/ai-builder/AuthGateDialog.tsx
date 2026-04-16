import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import sellspayLogo from "@/assets/sellspay-s-logo-new.png";

const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

interface AuthGateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional pending prompt to preserve through OAuth redirect */
  pendingPrompt?: string;
}

export function AuthGateDialog({ open, onOpenChange, pendingPrompt }: AuthGateDialogProps) {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const location = useLocation();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [discordLoading, setDiscordLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persist the pending prompt so it survives OAuth redirects
  const persistPrompt = () => {
    if (pendingPrompt) {
      try {
        sessionStorage.setItem("ai_builder_pending_prompt", pendingPrompt);
      } catch {}
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        // Signup requires a real email
        if (!email.includes("@")) throw new Error("Please enter a valid email address");
        const { error } = await signUp(email, password);
        if (error) throw error;
      } else {
        // Signin: accept either email or username
        let loginEmail = email.trim();
        const looksLikeEmail = loginEmail.includes("@");
        if (!looksLikeEmail) {
          // Resolve username → email via RPC
          const { data: resolvedEmail, error: rpcErr } = await supabase
            .rpc("get_email_by_username", { p_username: loginEmail });
          if (rpcErr) throw new Error("Could not look up that username");
          if (!resolvedEmail) throw new Error("No account found for that username");
          loginEmail = resolvedEmail as string;
        }
        const { error } = await signIn(loginEmail, password);
        if (error) throw error;
      }
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError(null);
    persistPrompt();
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "Google sign-in failed");
      setGoogleLoading(false);
    }
  };

  const handleDiscord = async () => {
    setDiscordLoading(true);
    setError(null);
    persistPrompt();
    try {
      const returnTo = location.pathname + location.search;
      const { data, error } = await supabase.functions.invoke("initiate-discord-login", {
        body: { returnTo, origin: window.location.origin },
      });
      if (error) throw error;
      if (data?.notConfigured) {
        setError("Discord login is not yet configured.");
        setDiscordLoading(false);
        return;
      }
      if (data?.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error("Failed to initiate Discord login");
      }
    } catch (err: any) {
      setError(err.message || "Discord sign-in failed");
      setDiscordLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-zinc-800 bg-zinc-950">
        <div className="px-8 pt-8 pb-6">
          <DialogHeader className="space-y-3 text-center">
            <div className="mx-auto relative w-14 h-14 mb-2">
              <div className="absolute inset-0 blur-2xl bg-primary/30 rounded-full" />
              <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 flex items-center justify-center">
                <img src={sellspayLogo} alt="" className="w-8 h-8 object-contain" />
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold text-white tracking-tight">
              {mode === "signup" ? "Sign up to start building" : "Welcome back"}
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-sm">
              {mode === "signup"
                ? "Create a free account to generate your storefront with AI."
                : "Sign in to continue building with AI."}
            </DialogDescription>
          </DialogHeader>

          {/* Social buttons */}
          <div className="space-y-2.5 mt-7">
            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading || discordLoading}
              className="w-full h-11 flex items-center justify-center gap-3 rounded-lg bg-white hover:bg-zinc-100 text-zinc-900 text-sm font-medium transition-all disabled:opacity-50"
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <GoogleIcon className="w-4 h-4" />
                  Continue with Google
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDiscord}
              disabled={discordLoading || googleLoading}
              className="w-full h-11 flex items-center justify-center gap-3 rounded-lg bg-[#5865F2] hover:bg-[#4752c4] text-white text-sm font-medium transition-all disabled:opacity-50"
            >
              {discordLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <DiscordIcon className="w-4 h-4" />
                  Continue with Discord
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-[11px] uppercase tracking-wider text-zinc-500 bg-zinc-950">
                or with email
              </span>
            </div>
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 px-4 rounded-lg bg-white/[0.04] border border-white/10 text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all text-sm"
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 px-4 pr-11 rounded-lg bg-white/[0.04] border border-white/10 text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <p className="text-xs text-rose-400 leading-snug">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-violet-500 hover:brightness-110 text-white text-sm font-semibold transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {mode === "signup" ? "Create account & build" : "Sign in & build"}
                </>
              )}
            </button>
          </form>

          {/* Toggle */}
          <p className="text-center text-xs text-zinc-500 mt-5">
            {mode === "signup" ? "Already have an account? " : "New here? "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signup" ? "signin" : "signup");
                setError(null);
              }}
              className="text-primary hover:text-primary/80 font-medium"
            >
              {mode === "signup" ? "Sign in" : "Create one"}
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
