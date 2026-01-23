import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Lock, User, Phone, ArrowRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function Signup() {
  const navigate = useNavigate();
  const { user, signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const cleanUsername = username.trim();
      const cleanEmail = email.trim().toLowerCase();
      const cleanPhone = phone.trim() || null;

      // Check username availability
      const { data: available, error: rpcError } = await supabase.rpc('is_username_available', { 
        p_username: cleanUsername 
      });
      
      if (rpcError) throw rpcError;
      if (!available) {
        setError('That username is already taken. Please choose another.');
        setLoading(false);
        return;
      }

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

            <form onSubmit={handleSignup} className="mt-6 space-y-4">
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
                  className="w-full pr-3 auth-input"
                />
              </div>
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
                disabled={loading}
                className="w-full primary flex items-center justify-center gap-2"
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
