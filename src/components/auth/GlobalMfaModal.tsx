import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Shield, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PendingMfa {
  userId: string;
  email: string;
  password: string;
}

/**
 * Single global MFA modal. Listens for `sellspay:mfa-required` events dispatched
 * from `auth.signIn()`. Any sign-in surface (Login page, AuthGateDialog, future
 * dialogs) gets the same OTP gate for free — no duplicated logic.
 */
export function GlobalMfaModal() {
  const [pending, setPending] = useState<PendingMfa | null>(null);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<PendingMfa>).detail;
      if (!detail?.userId) return;
      setPending(detail);
      setOtpCode("");
      setError(null);
      setVerificationToken(null);
      // Auto-send the first code
      sendCode(detail);
    };
    window.addEventListener("sellspay:mfa-required", handler as EventListener);
    return () => window.removeEventListener("sellspay:mfa-required", handler as EventListener);
  }, []);

  const sendCode = async (target: PendingMfa) => {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-verification-otp", {
        body: { email: target.email, userId: target.userId },
      });
      if (error) throw error;
      if (data?.verificationToken) setVerificationToken(data.verificationToken);
      toast.success("Verification code sent to your email");
    } catch (err: any) {
      console.error("[MFA] send-otp failed", err);
      toast.error("Failed to send verification code");
      setError("Could not send code. Try resending.");
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    if (!pending || otpCode.length !== 6 || !verificationToken) {
      if (!verificationToken) setError("Please request a new verification code");
      return;
    }
    setVerifying(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: { userId: pending.userId, code: otpCode, verificationToken, purpose: "login" },
      });
      if (error) throw new Error(error.message || "Verification failed");
      if (!data?.success) throw new Error(data?.error || "Invalid verification code");

      // OTP good — re-establish session by signing back in. The MFA gate in
      // signIn() won't re-trigger here because we bypass auth.signIn and call
      // supabase directly (skipping the gate event for this completion step).
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: pending.email,
        password: pending.password,
      });
      if (signInError) throw signInError;

      toast.success("Signed in successfully");
      setPending(null);
      setOtpCode("");
      setVerificationToken(null);
    } catch (err: any) {
      setError(err?.message || "Failed to verify code");
    } finally {
      setVerifying(false);
    }
  };

  const handleCancel = () => {
    setPending(null);
    setOtpCode("");
    setVerificationToken(null);
    setError(null);
  };

  if (!pending) return null;

  return (
    <Dialog open={!!pending} onOpenChange={(open) => { if (!open) handleCancel(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-3 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <DialogTitle className="text-xl font-bold">Two-Factor Authentication</DialogTitle>
          <DialogDescription>
            Enter the 6-digit code sent to{" "}
            <span className="font-medium text-foreground">{pending.email}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {error && <p className="text-destructive text-sm text-center">{error}</p>}

          <button
            onClick={handleVerify}
            disabled={verifying || otpCode.length !== 6}
            className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-semibold text-sm transition-all hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {verifying && <Loader2 className="w-4 h-4 animate-spin" />}
            {verifying ? "Verifying..." : "Verify & Sign In"}
          </button>

          <div className="flex items-center justify-between text-sm">
            <button
              onClick={handleCancel}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => pending && sendCode(pending)}
              disabled={sending}
              className="text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
            >
              {sending ? "Sending..." : "Resend code"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
