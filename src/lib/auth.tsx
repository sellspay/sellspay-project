import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface ProfileData {
  id: string;
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_creator: boolean;
  is_seller: boolean;
  verified: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: ProfileData | null;
  isAdmin: boolean;
  isOwner: boolean;
  loading: boolean;
  profileLoading: boolean;
  refreshProfile: () => Promise<void>;
  signUp: (email: string, password: string, metadata?: { full_name?: string; username?: string; phone?: string }) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to check user roles via database RPC
export const checkUserRole = async (role: 'admin' | 'moderator' | 'user' | 'owner'): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  const { data, error } = await supabase.rpc('has_role', { 
    _user_id: user.id, 
    _role: role 
  });
  
  if (error) {
    console.error('Error checking user role:', error);
    return false;
  }
  
  return data === true;
};

// Helper to check if a user_id has owner role (for displaying Owner badge)
export const checkIsOwner = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'owner')
    .maybeSingle();
  
  if (error) {
    console.error('Error checking owner status:', error);
    return false;
  }
  
  return !!data;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  // Fetch profile data
  const fetchProfile = useCallback(async (userId: string) => {
    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, username, full_name, avatar_url, is_creator, is_seller, verified')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        setProfile(null);
      } else if (data) {
        setProfile({
          id: data.id,
          user_id: data.user_id,
          username: data.username,
          full_name: data.full_name,
          avatar_url: data.avatar_url,
          is_creator: data.is_creator || false,
          is_seller: data.is_seller || false,
          verified: data.verified || false,
        });
      } else {
        setProfile(null);
      }

      // Check admin and owner roles
      const [adminResult, ownerResult] = await Promise.all([
        supabase.rpc('has_role', { _user_id: userId, _role: 'admin' }),
        supabase.rpc('has_role', { _user_id: userId, _role: 'owner' }),
      ]);

      setIsAdmin(adminResult.data === true);
      setIsOwner(ownerResult.data === true);
    } catch (err) {
      console.error('Error in fetchProfile:', err);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // Public method to refresh profile
  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  // Auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (session?.user) {
          // Defer profile fetch to avoid blocking auth state
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setProfile(null);
          setIsAdmin(false);
          setIsOwner(false);
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // Real-time profile subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('auth-profile-sync')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newData = payload.new as Record<string, unknown>;
          setProfile((prev) => prev ? {
            ...prev,
            username: (newData.username as string) || null,
            full_name: (newData.full_name as string) || null,
            avatar_url: (newData.avatar_url as string) || null,
            is_creator: Boolean(newData.is_creator),
            is_seller: Boolean(newData.is_seller),
            verified: Boolean(newData.verified),
          } : null);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const signUp = async (email: string, password: string, metadata?: { full_name?: string; username?: string; phone?: string }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: metadata
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setIsAdmin(false);
    setIsOwner(false);
  };

  const resetPassword = async (email: string) => {
    try {
      // Use custom edge function for properly styled password reset email
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: { email },
      });
      
      if (error) {
        return { error: new Error(error.message || 'Failed to send reset email') };
      }
      
      if (data?.error) {
        return { error: new Error(data.error) };
      }
      
      return { error: null };
    } catch (err) {
      console.error('Reset password error:', err);
      return { error: err as Error };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      profile,
      isAdmin,
      isOwner,
      loading, 
      profileLoading,
      refreshProfile,
      signUp, 
      signIn, 
      signInWithGoogle, 
      signOut, 
      resetPassword 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
