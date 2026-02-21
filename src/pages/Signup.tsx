import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, Loader2, Check, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';
import AuthMediaCarousel from '@/components/auth/AuthMediaCarousel';

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signUp, signInWithGoogle } = useAuth();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  const debouncedUsername = useDebounce(username.trim(), 500);
  const debouncedEmail = useDebounce(email.trim().toLowerCase(), 500);

  useEffect(() => {
    if (user) {
      const params = new URLSearchParams(location.search);
      const next = params.get('next');
      navigate(next || '/');
    }
  }, [user, navigate, location.search]);

  useEffect(() => {
    const checkUsername = async () => {
      if (!debouncedUsername || debouncedUsername.length < 3) { setUsernameStatus('idle'); return; }
      setUsernameStatus('checking');
      try {
        const { data, error } = await supabase.rpc('is_username_available', { p_username: debouncedUsername });
        if (error) throw error;
        setUsernameStatus(data ? 'available' : 'taken');
      } catch (err) { setUsernameStatus('idle'); }
    };
    checkUsername();
  }, [debouncedUsername]);

  useEffect(() => {
    const checkEmail = async () => {
      if (!debouncedEmail || !debouncedEmail.includes('@')) { setEmailStatus('idle'); return; }
      setEmailStatus('checking');
      try {
        const { data, error } = await supabase.rpc('is_email_available', { p_email: debouncedEmail });
        if (error) throw error;
        setEmailStatus(data ? 'available' : 'taken');
      } catch (err) { setEmailStatus('idle'); }
    };
    checkEmail();
  }, [debouncedEmail]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (usernameStatus === 'taken') { setError('That username is already taken.'); return; }
    if (emailStatus === 'taken') { setError('This email is already registered. Please sign in.'); return; }
    setLoading(true);
    try {
      const cleanUsername = username.trim();
      const cleanEmail = email.trim().toLowerCase();
      const cleanPhone = phone.trim() || null;
      const { error: signUpError } = await signUp(cleanEmail, password, {
        full_name: fullName.trim(),
        username: cleanUsername,
        phone: cleanPhone || undefined,
      });
      if (signUpError) throw signUpError;
      const { data: { user: newUser } } = await supabase.auth.getUser();
      if (newUser) {
        await supabase.from('profiles').update({ username: cleanUsername, full_name: fullName.trim() }).eq('user_id', newUser.id);
      }
      toast({ title: 'Account created!', description: 'Welcome to SellsPay.' });
      const params = new URLSearchParams(location.search);
      const next = params.get('next');
      navigate(next || '/');
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (/already/i.test(msg) || /registered/i.test(msg)) {
        setError('This email is already registered. Please sign in.');
      } else {
        setError(msg || 'Signup failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Google sign-up failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const renderValidationIcon = (status: 'idle' | 'checking' | 'available' | 'taken') => {
    switch (status) {
      case 'checking': return <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />;
      case 'available': return <Check className="h-4 w-4" style={{ color: 'hsl(142 76% 46%)' }} />;
      case 'taken': return <X className="h-4 w-4 text-destructive" />;
      default: return null;
    }
  };

  const getInputBorderClass = (status: 'idle' | 'checking' | 'available' | 'taken') => {
    switch (status) {
      case 'available': return 'border-primary/50 focus:border-primary/70';
      case 'taken': return 'border-destructive/50 focus:border-destructive/70';
      default: return 'border-border focus:border-primary';
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Half — Media Carousel (hidden on mobile) */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <AuthMediaCarousel />
      </div>

      {/* Home button overlaying the media section */}
      <Link to="/" className="absolute top-6 left-6 text-sm text-white/70 hover:text-white transition-colors z-30 hidden lg:block">
        ← Home
      </Link>

      {/* Right Half — Form */}
      <div className="w-full lg:w-1/2 flex flex-col min-h-screen overflow-y-auto relative">
        {/* Mobile-only home link */}
        <Link to="/" className="absolute top-6 left-6 text-sm text-muted-foreground hover:text-foreground transition-colors z-10 lg:hidden">
          ← Home
        </Link>

        <div className="flex-1 flex items-center justify-center px-6 sm:px-12 lg:px-16 py-8">
          <div className="w-full max-w-[420px]">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">Join the Community</h1>
              <p className="text-muted-foreground">Create your account and start your journey</p>
            </div>

            <p className="text-muted-foreground mb-6 text-sm">
              Already have an account?{' '}
              <Link to={`/login${location.search}`} className="text-primary font-medium hover:underline">Log in</Link>
            </p>

            <div className="space-y-6">
              {/* Google Sign Up */}
              <button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={googleLoading}
                className="w-full h-12 flex items-center justify-center gap-3 rounded-lg bg-card/60 border border-border text-foreground font-medium transition-all duration-300 hover:bg-white hover:text-black hover:border-white/60 disabled:opacity-50"
              >
                {googleLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                <span>{googleLoading ? 'Connecting...' : 'Sign up with Google'}</span>
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-background px-4 text-xs text-muted-foreground uppercase">or</span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Full Name</label>
                  <input type="text" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} required
                    className="w-full h-12 px-4 rounded-lg bg-card/60 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Username</label>
                  <div className="relative">
                    <input type="text" placeholder="johndoe" value={username} onChange={(e) => setUsername(e.target.value)} required
                      className={`w-full h-12 px-4 pr-12 rounded-lg bg-card/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${getInputBorderClass(usernameStatus)}`} />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">{renderValidationIcon(usernameStatus)}</div>
                  </div>
                  {usernameStatus === 'taken' && <p className="text-destructive text-xs">Username is already taken</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Email</label>
                  <div className="relative">
                    <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required
                      className={`w-full h-12 px-4 pr-12 rounded-lg bg-card/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${getInputBorderClass(emailStatus)}`} />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">{renderValidationIcon(emailStatus)}</div>
                  </div>
                  {emailStatus === 'taken' && <p className="text-destructive text-xs">This email is already registered.</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Phone <span className="text-muted-foreground/50">(optional)</span></label>
                  <input type="tel" placeholder="+1 (555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg bg-card/60 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Password</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} placeholder="••••••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                      className="w-full h-12 px-4 pr-12 rounded-lg bg-card/60 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && <p className="text-destructive text-sm text-center">{error}</p>}

                <button type="submit" disabled={loading || usernameStatus === 'taken' || emailStatus === 'taken'}
                  className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-medium transition-all duration-300 hover:bg-primary/90 disabled:opacity-50">
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </button>
              </form>

              {/* Terms */}
              <p className="text-center text-xs text-muted-foreground">
                By signing up, you agree to our{' '}
                <Link to="/terms" className="underline hover:text-foreground">Terms</Link>
                {' '}and{' '}
                <Link to="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
