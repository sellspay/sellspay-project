import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, Eye, EyeOff, Shield, Loader2 } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import authBg from '@/assets/auth-bg.png';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signIn, signOut, resetPassword, signInWithGoogle } = useAuth();
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 2FA State
  const [showMfaVerification, setShowMfaVerification] = useState(false);
  const [mfaUserId, setMfaUserId] = useState<string | null>(null);
  const [mfaEmail, setMfaEmail] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    // Only redirect if user is logged in AND not in MFA verification flow
    if (user && !showMfaVerification) {
      const params = new URLSearchParams(location.search);
      const next = params.get('next');
      navigate(next || '/');
    }
  }, [user, navigate, location.search, showMfaVerification]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let emailToUse = credential.trim();
      
      if (!emailToUse.includes('@')) {
        const { data: email, error: rpcError } = await supabase.rpc('get_email_by_username', {
          p_username: emailToUse
        });
        
        if (rpcError) throw rpcError;
        
        if (!email) {
          setError('Username not found');
          setLoading(false);
          return;
        }
        
        emailToUse = email;
      }
      
      const { error } = await signIn(emailToUse, password);
      if (error) throw error;

      // Check if user has MFA enabled
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('mfa_enabled')
          .eq('user_id', authUser.id)
          .single();

        if (profile?.mfa_enabled) {
          // User has MFA enabled - sign them out and show verification
          setMfaUserId(authUser.id);
          setMfaEmail(authUser.email || emailToUse);
          await signOut();
          setShowMfaVerification(true);
          setLoading(false);
          // Automatically send OTP
          await sendMfaCode(authUser.id, authUser.email || emailToUse);
          return;
        }
      }
      
      // No MFA - redirect handled by useEffect
    } catch (err: any) {
      setError('Invalid email/username or password');
    } finally {
      setLoading(false);
    }
  };

  const sendMfaCode = async (userId: string, email: string) => {
    setSendingOtp(true);
    try {
      const { error } = await supabase.functions.invoke("send-verification-otp", {
        body: { email, userId }
      });
      
      if (error) throw error;
      
      setOtpSent(true);
      toast.success('Verification code sent to your email.');
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast.error('Failed to send verification code.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleMfaVerify = async () => {
    if (!mfaUserId || !otpCode || otpCode.length !== 6) return;
    
    setVerifyingOtp(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: { userId: mfaUserId, code: otpCode, purpose: 'login' }
      });
      
      if (error) throw new Error(error.message || 'Verification failed');
      if (!data?.success) {
        throw new Error(data?.error || 'Invalid verification code');
      }
      
      // OTP verified - now sign in again
      let emailToUse = credential.trim();
      if (!emailToUse.includes('@')) {
        const { data: email } = await supabase.rpc('get_email_by_username', {
          p_username: emailToUse
        });
        if (email) emailToUse = email;
      }
      
      const { error: signInError } = await signIn(emailToUse, password);
      if (signInError) throw signInError;
      
      toast.success('Successfully verified!');
      // Redirect will be handled by useEffect
      setShowMfaVerification(false);
    } catch (error) {
      console.error('Error verifying OTP:', error);
      const message = error instanceof Error ? error.message : 'Failed to verify code.';
      setError(message);
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResendCode = async () => {
    if (mfaUserId && mfaEmail) {
      await sendMfaCode(mfaUserId, mfaEmail);
    }
  };

  const handleBackToLogin = () => {
    setShowMfaVerification(false);
    setMfaUserId(null);
    setMfaEmail(null);
    setOtpCode('');
    setOtpSent(false);
    setError(null);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResetMessage('');
    setLoading(true);

    try {
      const { error } = await resetPassword(resetEmail.trim());
      if (error) throw error;
      setResetMessage('Check your email for the password reset link.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    }
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Cosmic Background Image */}
      <div className="absolute inset-0 pointer-events-none">
        <img 
          src={authBg} 
          alt="" 
          className="w-full h-full object-cover"
          loading="eager"
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Back to Home */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors z-20 pointer-events-auto"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="text-sm">Home</span>
      </Link>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-16">
        {/* Premium Welcome Text */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
            {showMfaVerification 
              ? 'Two-Factor Authentication' 
              : showForgotPassword 
                ? 'Reset Password' 
                : 'Welcome Back'}
          </h1>
          <p className="text-lg text-white/60">
            {showMfaVerification
              ? 'Enter the code sent to your email'
              : showForgotPassword 
                ? 'Enter your email to reset your password' 
                : 'Sign in to continue your journey'}
          </p>
        </div>
        
        {!showForgotPassword && !showMfaVerification && (
          <p className="text-muted-foreground mb-8">
            Don't have an account?{' '}
            <Link to="/signup" className="text-foreground font-medium hover:underline">
              Sign up
            </Link>
            .
          </p>
        )}

        {/* MFA Verification View */}
        {showMfaVerification ? (
          <div className="w-full max-w-[400px] space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                A verification code has been sent to:<br />
                <span className="font-medium text-foreground">{mfaEmail}</span>
              </p>
            </div>

            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otpCode}
                onChange={(value) => setOtpCode(value)}
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

            {error && (
              <p className="text-destructive text-sm text-center">{error}</p>
            )}

            <button
              onClick={handleMfaVerify}
              disabled={verifyingOtp || otpCode.length !== 6}
              className="w-full h-12 rounded-lg bg-gradient-to-r from-primary via-accent to-primary border border-primary/60 text-white font-medium shadow-[0_0_30px_hsl(var(--primary)/0.4)] transition-all duration-300 hover:shadow-[0_0_40px_hsl(var(--primary)/0.6)] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {verifyingOtp && <Loader2 className="w-4 h-4 animate-spin" />}
              {verifyingOtp ? 'Verifying...' : 'Verify & Sign In'}
            </button>

            <div className="flex items-center justify-between">
              <button
                onClick={handleBackToLogin}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to login
              </button>
              <button
                onClick={handleResendCode}
                disabled={sendingOtp}
                className="text-sm text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
              >
                {sendingOtp ? 'Sending...' : 'Resend code'}
              </button>
            </div>
          </div>
        ) : showForgotPassword ? (
          <div className="w-full max-w-[400px] space-y-6">
            <p className="text-sm text-muted-foreground text-center">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  className="w-full h-12 px-4 rounded-lg bg-card/40 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              {resetMessage && (
                <p className="text-sm text-center" style={{ color: 'hsl(142 76% 56%)' }}>{resetMessage}</p>
              )}
              {error && (
                <p className="text-destructive text-sm text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-lg bg-card/40 border border-border/50 text-white font-medium transition-all duration-300 hover:bg-gradient-to-r hover:from-primary hover:via-accent hover:to-primary hover:border-primary/60 hover:shadow-[0_0_30px_hsl(var(--primary)/0.6),0_0_60px_hsl(var(--primary)/0.3)] disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <button
              onClick={() => { setShowForgotPassword(false); setResetMessage(''); setError(null); }}
              className="w-full text-center text-sm text-muted-foreground transition-all duration-300 hover:text-primary hover:drop-shadow-[0_0_8px_hsl(var(--primary)/0.55)]"
            >
              Back to login
            </button>
          </div>
        ) : (
          <div className="w-full max-w-[400px] space-y-6">
            {/* OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full h-12 flex items-center justify-center gap-3 rounded-lg bg-card/40 border border-border/50 text-white font-medium transition-all duration-300 hover:bg-gradient-to-r hover:from-primary hover:via-accent hover:to-primary hover:border-primary/60 hover:shadow-[0_0_30px_hsl(var(--primary)/0.6),0_0_60px_hsl(var(--primary)/0.3)]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Login with Google</span>
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-transparent backdrop-blur-sm px-4 text-sm text-muted-foreground">or</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Email or username</label>
                <input
                  type="text"
                  placeholder="you@example.com or johndoe"
                  value={credential}
                  onChange={(e) => setCredential(e.target.value)}
                  required
                  className="w-full h-12 px-4 rounded-lg bg-card/40 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-muted-foreground">Password</label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-muted-foreground transition-all duration-300 hover:text-primary hover:drop-shadow-[0_0_8px_hsl(var(--primary)/0.55)]"
                  >
                    Forgot your password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full h-12 px-4 pr-12 rounded-lg bg-card/40 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-destructive text-sm text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-lg bg-card/40 border border-border/50 text-white font-medium transition-all duration-300 hover:bg-gradient-to-r hover:from-primary hover:via-accent hover:to-primary hover:border-primary/60 hover:shadow-[0_0_30px_hsl(var(--primary)/0.6),0_0_60px_hsl(var(--primary)/0.3)] disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Log In'}
              </button>
            </form>

            {/* Terms */}
            <p className="text-center text-xs text-muted-foreground">
              By signing in, you agree to our{' '}
              <Link to="/terms" className="underline hover:text-foreground">Terms</Link>
              {' '}and{' '}
              <Link to="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
