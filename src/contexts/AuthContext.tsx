import React, { createContext, useContext, useEffect, useState } from 'react';
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

  // useEffect (1): Hanya untuk sinkronisasi sesi dan user dari Supabase Auth
  useEffect(() => {
    // Cek sesi saat komponen pertama kali dimuat
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      // Loading berhenti setelah sesi awal dicek, bukan setelah profil didapat
      setLoading(false); 
    });

    // Listener untuk memantau perubahan status otentikasi
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Cleanup listener saat komponen di-unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // useEffect (2): Untuk mengambil data profil dari database HANYA KETIKA user berubah
  useEffect(() => {
    // Jika ada user dan belum ada profil, ambil datanya
    if (user && !profile) {
      supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('[Auth] Gagal mengambil profil:', error);
          }
          setProfile(data ?? null);
        });
    } else if (!user) {
      // Jika tidak ada user (logout), hapus data profil
      setProfile(null);
    }
  }, [user, profile]); // <-- Dijalankan ketika 'user' atau 'profile' berubah

  // Fungsi lainnya tetap sama
  const signUp = async (email: string, password: string, name: string, role: 'admin' | 'user' = 'user') => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { name, role },
        },
      });
      if (signUpError) throw signUpError;
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    // State user, session, dan profile akan di-reset oleh listener di useEffect
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    signUp,
    signIn,
    signOut,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
