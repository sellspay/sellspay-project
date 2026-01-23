import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signIn, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
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
      const { error } = await signIn(email.trim(), password);
      if (error) throw error;
    } catch (err: any) {
      setError('Invalid email or password');
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
              <form onSubmit={handleLogin} className="mt-6 space-y-4">
                <div className="relative">
                  <Mail className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
