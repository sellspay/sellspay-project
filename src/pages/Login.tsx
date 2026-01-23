import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Lock, ArrowRight, AtSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
      
      // If credential doesn't contain @, treat it as a username
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
    <div className="auth-bg text-foreground">
      <div className="auth-shell px-4">
        <div className="auth-card">
          {/* Left Panel */}
          <div className="auth-left hidden lg:block">
            <div className="brand">EditorsParadise</div>
            <h1>Welcome back</h1>
            <p>Access your tools, premium resources, and creators.</p>
            <ul>
              <li><span className="dot"></span> Secure & private</li>
              <li><span className="dot"></span> Member features</li>
              <li><span className="dot"></span> Creator tools</li>
            </ul>
          </div>

          {/* Right Panel - Form */}
          <div className="auth-right">
            <div className="auth-tabs mb-2">
              <button className="tab active">Log in</button>
              <button className="tab" onClick={() => navigate('/signup')}>Sign up</button>
            </div>

            {showForgotPassword ? (
              <div className="mt-6 space-y-5">
                <p className="text-sm text-muted-foreground">Enter your email to receive a password reset link</p>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="relative">
                    <Mail className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      type="email"
                      placeholder="Email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      className="pl-10"
                    />
                  </div>

                  {resetMessage && <p className="text-green-400 text-sm">{resetMessage}</p>}
                  {error && <p className="text-destructive text-sm">{error}</p>}

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                </form>
                <button
                  onClick={() => { setShowForgotPassword(false); setResetMessage(''); setError(null); }}
                  className="text-muted-foreground hover:text-foreground transition text-sm"
                >
                  Back to login
                </button>
              </div>
            ) : (
              <>
                {/* Google Sign In Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full mt-4 flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-border bg-card hover:bg-secondary/50 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-sm font-medium">Continue with Google</span>
                </button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
                  </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="relative">
                    <AtSign className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Email or Username"
                      value={credential}
                      onChange={(e) => setCredential(e.target.value)}
                      required
                      className="w-full pr-3 auth-input"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pr-3 auth-input"
                    />
                  </div>

                  {error && <p className="text-destructive text-sm">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full primary flex items-center justify-center gap-2"
                  >
                    <span>{loading ? 'Logging in...' : 'Log In'}</span>
                    {!loading && <ArrowRight className="h-4 w-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-muted-foreground hover:text-foreground transition text-sm"
                  >
                    Forgot password?
                  </button>
                </form>
              </>
            )}

            <p className="text-center text-muted-foreground mt-6">
              Don't have an account?{' '}
              <Link to="/signup" className="text-foreground hover:underline font-semibold">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}