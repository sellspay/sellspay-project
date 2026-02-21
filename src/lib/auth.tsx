import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';

export interface ProfileData {
  id: string;
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_creator: boolean;
  is_seller: boolean;
  is_editor: boolean;
  verified: boolean;
  seller_contract_signed_at: string | null;
  referral_code: string | null;
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
        .select('id, user_id, username, full_name, avatar_url, is_creator, is_seller, is_editor, verified, seller_contract_signed_at, referral_code')
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
          is_editor: data.is_editor || false,
          verified: data.verified || false,
          seller_contract_signed_at: data.seller_contract_signed_at || null,
          referral_code: data.referral_code || null,
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
    // Check if this is a new browser session and user didn't want to be remembered
    const tempSession = sessionStorage.getItem('tempSession');
    const wasRemembered = localStorage.getItem('rememberMe') === 'true';
    
    // If tempSession flag exists in a previous session but not in current sessionStorage,
    // it means browser was closed and reopened - clear the session
    if (!wasRemembered && !tempSession && localStorage.getItem('supabase.auth.token')) {
      // Session should be cleared - user didn't want to be remembered
      supabase.auth.signOut();
    }
    
    // Set up auth state listener FIRST (before getSession)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] State change:', event);
        
        // Handle token refresh failures - this happens when server restarts invalidate sessions
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.log('[Auth] Token refresh failed, clearing stale session');
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
          setIsOwner(false);
          setLoading(false);
          return;
        }
        
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

    // Get initial session and validate it
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        // If there's a session, verify it's still valid by checking with the server
        if (session) {
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError || !user) {
            // Session is stale/invalid - clear it
            console.log('[Auth] Stale session detected, signing out:', userError?.message);
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setLoading(false);
            return;
          }
          
          // Session is valid
          setSession(session);
          setUser(user);
          fetchProfile(user.id);
        } else {
          setSession(null);
          setUser(null);
        }
      } catch (err) {
        console.error('[Auth] Initialization error:', err);
        // On any error, clear potentially corrupted state
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

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
    
    // Check if user wants to be remembered
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    if (!rememberMe) {
      // Mark session as temporary - will be cleared on browser close
      sessionStorage.setItem('tempSession', 'true');
    } else {
      sessionStorage.removeItem('tempSession');
    }
    
    return { error };
  };

  const signInWithGoogle = async () => {
    // Redirect back into the SPA so we can read the URL fragment (#access_token...)
    // Note: fragments are not sent to servers, which is why hitting oauth.lovable.app/callback
    // directly results in “Missing state parameter”.
    const redirectUri = `${window.location.origin}/~oauth/callback`;

    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: redirectUri,
    });

    return { error: result.error ?? null };
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
