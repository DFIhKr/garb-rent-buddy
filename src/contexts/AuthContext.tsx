import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  name: string;
  role: 'admin' | 'user';
  class?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  signUp: (email: string, password: string, name: string, role?: 'admin' | 'user') => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // refs to avoid duplicate fetches
  const currentUserIdRef = useRef<string | null>(null);
  const fetchingRef = useRef(false);

  const fetchProfile = async (userId: string) => {
    // jika sedang fetch atau userId sama dengan yang sudah ada, skip
    if (fetchingRef.current) {
      console.log('[Auth] fetchProfile skipped: already fetching');
      return;
    }
    if (currentUserIdRef.current === userId && profile) {
      console.log('[Auth] fetchProfile skipped: same userId');
      return;
    }

    fetchingRef.current = true;
    try {
      console.log('[Auth] fetchProfile start for', userId);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[Auth] fetchProfile error', error);
        setProfile(null);
      } else {
        setProfile(data ?? null);
        currentUserIdRef.current = userId;
      }
    } catch (err) {
      console.error('[Auth] fetchProfile catch', err);
      setProfile(null);
    } finally {
      fetchingRef.current = false;
    }
  };

  useEffect(() => {
    let mounted = true;

    // subscribe perubahan auth (dipanggil sekali saat mounted)
    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;
      setSession(newSession ?? null);
      setUser(newSession?.user ?? null);

      // jika ada user, fetch profile (tapi fetchProfile akan mencegah duplikasi)
      if (newSession?.user?.id) {
        fetchProfile(newSession.user.id);
      } else {
        setProfile(null);
        currentUserIdRef.current = null;
      }

      // selesai pengecekan auth untuk event ini
      setLoading(false);
    });

    // juga cek session saat pertama kali mount (getSession)
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return;
        setSession(session ?? null);
        setUser(session?.user ?? null);

        if (session?.user?.id) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
          currentUserIdRef.current = null;
        }
      })
      .catch(err => {
        console.error('[Auth] getSession error', err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
      // cleanup listener
      try {
        listener?.subscription?.unsubscribe();
      } catch (e) {
        // ignore
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run sekali saat mount

  const signUp = async (email: string, password: string, name: string, role: 'admin' | 'user' = 'user') => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name,
            role
          }
        }
      });

      if (signUpError) throw signUpError;
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    currentUserIdRef.current = null;
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    signUp,
    signIn,
    signOut,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
