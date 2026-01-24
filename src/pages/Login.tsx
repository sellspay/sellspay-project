import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react';
import authBg from '@/assets/auth-bg.png';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signIn, resetPassword, signInWithGoogle } = useAuth();
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      const params = new URLSearchParams(location.search);
      const next = params.get('next');
      navigate(next || '/');
    }
  }, [user, navigate, location.search]);

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
    } catch (err: any) {
      setError('Invalid email/username or password');
    } finally {
      setLoading(false);
    }
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
      <div className="absolute inset-0">
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
        className="absolute top-6 left-6 flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors z-10"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="text-sm">Home</span>
      </Link>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-16">
        {/* Premium Welcome Text */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
            {showForgotPassword ? 'Reset Password' : 'Welcome Back'}
          </h1>
          <p className="text-lg text-white/60">
            {showForgotPassword ? 'Enter your email to reset your password' : 'Sign in to continue your journey'}
          </p>
        </div>
        
        {!showForgotPassword && (
          <p className="text-muted-foreground mb-8">
            Don't have an account?{' '}
            <Link to="/signup" className="text-foreground font-medium hover:underline">
              Sign up
            </Link>
            .
          </p>
        )}

        {showForgotPassword ? (
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
                  className="w-full h-12 px-4 rounded-lg bg-[#0a0a0a] border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
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
                className="w-full h-12 rounded-lg bg-[#0a0a0a] border border-white/10 text-white font-medium transition-all duration-300 hover:bg-gradient-to-r hover:from-purple-600 hover:via-violet-500 hover:to-purple-600 hover:border-purple-400/60 hover:shadow-[0_0_30px_rgba(147,51,234,0.6),0_0_60px_rgba(147,51,234,0.3)] disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <button
              onClick={() => { setShowForgotPassword(false); setResetMessage(''); setError(null); }}
              className="w-full text-center text-sm text-muted-foreground transition-all duration-300 hover:text-purple-400 hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]"
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
              className="w-full h-12 flex items-center justify-center gap-3 rounded-lg bg-[#0a0a0a] border border-white/10 text-white font-medium transition-all duration-300 hover:bg-gradient-to-r hover:from-purple-600 hover:via-violet-500 hover:to-purple-600 hover:border-purple-400/60 hover:shadow-[0_0_30px_rgba(147,51,234,0.6),0_0_60px_rgba(147,51,234,0.3)]"
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
                <label className="text-sm text-muted-foreground">Email</label>
                <input
                  type="text"
                  placeholder="you@example.com"
                  value={credential}
                  onChange={(e) => setCredential(e.target.value)}
                  required
                  className="w-full h-12 px-4 rounded-lg bg-[#0a0a0a] border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-muted-foreground">Password</label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-muted-foreground transition-all duration-300 hover:text-purple-400 hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]"
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
                    className="w-full h-12 px-4 pr-12 rounded-lg bg-[#0a0a0a] border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
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
                className="w-full h-12 rounded-lg bg-[#0a0a0a] border border-white/10 text-white font-medium transition-all duration-300 hover:bg-gradient-to-r hover:from-purple-600 hover:via-violet-500 hover:to-purple-600 hover:border-purple-400/60 hover:shadow-[0_0_30px_rgba(147,51,234,0.6),0_0_60px_rgba(147,51,234,0.3)] disabled:opacity-50"
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