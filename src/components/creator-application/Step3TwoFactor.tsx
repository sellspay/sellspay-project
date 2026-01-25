import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Check, Shield, Loader2, Mail } from 'lucide-react';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';

interface Step3Props {
  userEmail: string;
  mfaEnabled: boolean;
  onMfaEnabled: () => void;
  otpSent: boolean;
  onOtpSent: () => void;
}

export default function Step3TwoFactor({ userEmail, mfaEnabled, onMfaEnabled, otpSent, onOtpSent }: Step3Props) {
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

  const sendOtp = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('send-verification-otp', {
        body: { email: userEmail, userId: user.id },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Store the verification token (stateless - no DB storage)
      if (data?.verificationToken) {
        setVerificationToken(data.verificationToken);
      }

      onOtpSent();
      toast.success('Verification code sent to your email');
    } catch (err: any) {
      console.error('OTP error:', err);
      toast.error(err.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otpCode.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }

    if (!verificationToken) {
      toast.error('Please request a new verification code');
      return;
    }

    setVerifying(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Pass the verification token for stateless verification
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: { 
          userId: user.id, 
          code: otpCode,
          verificationToken,
          purpose: 'enable_mfa'
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Two-factor authentication enabled!');
      setVerificationToken(null); // Clear the token
      onMfaEnabled();
    } catch (err: any) {
      console.error('Verify error:', err);
      toast.error(err.message || 'Invalid verification code');
    } finally {
      setVerifying(false);
    }
  };

  if (mfaEnabled) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-1">Two-Factor Authentication</h3>
          <p className="text-sm text-muted-foreground">
            Your account is protected with 2FA.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <h4 className="text-xl font-semibold text-green-500 mb-2">2FA Active</h4>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            Your account is secured with two-factor authentication. 
            You'll receive a verification code via email each time you sign in.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Two-Factor Authentication</h3>
        <p className="text-sm text-muted-foreground">
          For security purposes, all creators must have 2FA enabled.
        </p>
      </div>

      {!otpSent ? (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-4">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h4 className="text-xl font-semibold mb-2">Enable 2FA</h4>
          <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
            We'll send a 6-digit verification code to <strong>{userEmail}</strong> to verify your identity.
          </p>
          <Button onClick={sendOtp} disabled={loading} className="gap-2">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                Send Verification Code
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h4 className="text-xl font-semibold mb-2">Enter Verification Code</h4>
          <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
            We've sent a 6-digit code to <strong>{userEmail}</strong>. 
            Check your inbox and enter the code below.
          </p>

          <div className="mb-6">
            <InputOTP
              maxLength={6}
              value={otpCode}
              onChange={setOtpCode}
            >
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

          <div className="flex gap-3">
            <Button variant="outline" onClick={sendOtp} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Resend'}
            </Button>
            <Button onClick={verifyOtp} disabled={verifying || otpCode.length !== 6}>
              {verifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                'Verify & Enable 2FA'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
