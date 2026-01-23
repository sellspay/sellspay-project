import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Lock, User, Phone, ArrowRight, Loader2, Check, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';

export default function Signup() {
  const navigate = useNavigate();
  const { user, signUp, signInWithGoogle } = useAuth();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real-time validation states
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  
  const debouncedUsername = useDebounce(username.trim(), 500);
  const debouncedEmail = useDebounce(email.trim().toLowerCase(), 500);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Check username availability
  useEffect(() => {
    const checkUsername = async () => {
      if (!debouncedUsername || debouncedUsername.length < 3) {
        setUsernameStatus('idle');
        return;
      }
      
      setUsernameStatus('checking');
      try {
        const { data, error } = await supabase.rpc('is_username_available', { 
          p_username: debouncedUsername 
        });
        
        if (error) throw error;
        setUsernameStatus(data ? 'available' : 'taken');
      } catch (err) {
        console.error('Username check error:', err);
        setUsernameStatus('idle');
      }
    };
    
    checkUsername();
  }, [debouncedUsername]);

  // Check email availability
  useEffect(() => {
    const checkEmail = async () => {
      if (!debouncedEmail || !debouncedEmail.includes('@')) {
        setEmailStatus('idle');
        return;
      }
      
      setEmailStatus('checking');
      try {
        const { data, error } = await supabase.rpc('is_email_available', { 
          p_email: debouncedEmail 
        });
        
        if (error) throw error;
        setEmailStatus(data ? 'available' : 'taken');
      } catch (err) {
        console.error('Email check error:', err);
        setEmailStatus('idle');
      }
    };
    
    checkEmail();
  }, [debouncedEmail]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Block if username or email is taken
    if (usernameStatus === 'taken') {
      setError('That username is already taken. Please choose another.');
      return;
    }
    if (emailStatus === 'taken') {
      setError('That email is already registered. Try logging in instead.');
      return;
    }

    setLoading(true);

    try {
      const cleanUsername = username.trim();
      const cleanEmail = email.trim().toLowerCase();
      const cleanPhone = phone.trim() || null;

      // Sign up
      const { error: signUpError } = await signUp(cleanEmail, password, {
        full_name: fullName.trim(),
        username: cleanUsername,
        phone: cleanPhone || undefined,
      });

      if (signUpError) throw signUpError;

      // Update profile with additional data
      const { data: { user: newUser } } = await supabase.auth.getUser();
      if (newUser) {
        await supabase
          .from('profiles')
          .update({
            username: cleanUsername,
            full_name: fullName.trim(),
            phone: cleanPhone,
          })
          .eq('user_id', newUser.id);
      }

      toast({
        title: 'Account created!',
        description: 'Welcome to EditorsParadise.',
      });

      navigate('/');
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (/already/i.test(msg)) {
        setError('That email is already registered. Try logging in instead.');
      } else {
        setError(msg || 'Signup failed');
      }
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

  const renderValidationIcon = (status: 'idle' | 'checking' | 'available' | 'taken') => {
    switch (status) {
      case 'checking':
        return <Loader2 className="h-4 w-4 text-muted-foreground animate-spin absolute right-3 top-1/2 -translate-y-1/2" />;
      case 'available':
        return <Check className="h-4 w-4 text-green-500 absolute right-3 top-1/2 -translate-y-1/2" />;
      case 'taken':
        return <X className="h-4 w-4 text-destructive absolute right-3 top-1/2 -translate-y-1/2" />;
      default:
        return null;
    }
  };

  return (
    <div className="auth-bg text-foreground">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
      </div>

      <div className="auth-shell px-4">
        <div className="auth-card">
          {/* Left Panel */}
          <div className="auth-left hidden lg:block">
            <div className="brand">EditorsParadise</div>
            <h1>Join the community</h1>
            <p>Start sharing and accessing premium resources crafted by creators.</p>
            <ul>
              <li><span className="dot"></span> Publish and sell products</li>
              <li><span className="dot"></span> Follow and connect with creators</li>
              <li><span className="dot"></span> Download member files</li>
            </ul>
          </div>

          {/* Right Panel - Form */}
          <div className="auth-right">
            <div className="auth-tabs mb-2">
              <button className="tab" onClick={() => navigate('/login')}>Log in</button>
              <button className="tab active">Sign up</button>
            </div>

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

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="relative">
                <User className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full pr-3 auth-input"
                />
              </div>
              <div className="relative">
                <User className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className={`w-full pr-10 auth-input ${usernameStatus === 'taken' ? 'border-destructive' : usernameStatus === 'available' ? 'border-green-500' : ''}`}
                />
                {renderValidationIcon(usernameStatus)}
              </div>
              {usernameStatus === 'taken' && (
                <p className="text-destructive text-xs -mt-2">Username is already taken</p>
              )}
              <div className="relative">
                <Mail className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={`w-full pr-10 auth-input ${emailStatus === 'taken' ? 'border-destructive' : emailStatus === 'available' ? 'border-green-500' : ''}`}
                />
                {renderValidationIcon(emailStatus)}
              </div>
              {emailStatus === 'taken' && (
                <p className="text-destructive text-xs -mt-2">Email is already registered</p>
              )}
              <div className="relative">
                <Phone className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  placeholder="Phone (optional)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
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
                  minLength={6}
                  className="w-full pr-3 auth-input"
                />
              </div>

              {error && <p className="text-destructive text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading || usernameStatus === 'taken' || emailStatus === 'taken'}
                className="w-full primary flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{loading ? 'Creating Account...' : 'Sign Up'}</span>
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            <p className="text-center text-muted-foreground mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-foreground hover:underline font-semibold">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}