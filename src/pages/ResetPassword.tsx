import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Lock, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasValidSession, setHasValidSession] = useState(false);

  useEffect(() => {
    // Check if user arrived via password reset link (they'll have a session)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setHasValidSession(!!session);
      setSessionChecked(true);
      
      if (!session) {
        // No session means the link was invalid/expired or already used
        toast.error('Password reset link is invalid or has expired. Please request a new one.');
      }
    };
    
    checkSession();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) throw error;
      
      setSuccess(true);
      toast.success('Password updated successfully!');
      
      // Redirect to home after a short delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (!sessionChecked) {
    return (
      <div className="auth-bg text-foreground">
        <div className="auth-shell px-4">
          <div className="auth-card">
            <div className="auth-right w-full flex items-center justify-center">
              <p className="text-muted-foreground">Verifying reset link...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasValidSession) {
    return (
      <div className="auth-bg text-foreground">
        <div className="auth-shell px-4">
          <div className="auth-card">
            <div className="auth-right w-full">
              <h2 className="text-2xl font-bold mb-4">Link Expired</h2>
              <p className="text-muted-foreground mb-6">
                This password reset link is invalid or has already been used. 
                Please request a new password reset link.
              </p>
              <Button onClick={() => navigate('/login')} className="w-full">
                Back to Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="auth-bg text-foreground">
        <div className="auth-shell px-4">
          <div className="auth-card">
            <div className="auth-right w-full text-center">
              <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Password Updated!</h2>
              <p className="text-muted-foreground">
                Redirecting you to the homepage...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-bg text-foreground">
      <div className="auth-shell px-4">
        <div className="auth-card">
          {/* Left Panel */}
          <div className="auth-left hidden lg:block">
            <div className="brand">EditorsParadise</div>
            <h1>Set New Password</h1>
            <p>Create a new password for your migrated account.</p>
            <ul>
              <li><span className="dot"></span> At least 6 characters</li>
              <li><span className="dot"></span> Secure & private</li>
              <li><span className="dot"></span> One-time setup</li>
            </ul>
          </div>

          {/* Right Panel - Form */}
          <div className="auth-right">
            <h2 className="text-2xl font-bold mb-2">Create New Password</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Enter your new password below to complete your account migration.
            </p>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="relative">
                <Lock className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pr-3 auth-input"
                />
              </div>
              <div className="relative">
                <Lock className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                <span>{loading ? 'Updating...' : 'Update Password'}</span>
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
