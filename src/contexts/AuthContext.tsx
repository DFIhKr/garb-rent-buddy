// src/contexts/AuthContext.tsx
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
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      // 1. Coba dapatkan sesi yang sedang berjalan
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Error getting session:', sessionError);
        setLoading(false);
        return;
      }

      setSession(session);
      const currentUser = session?.user;
      setUser(currentUser ?? null);

      // 2. Jika ada user, coba ambil profilnya dari database
      if (currentUser) {
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        
        if (profileError) {
          console.error('Error fetching profile:', profileError.message);
          // Jika gagal fetch profile (misal RLS), tetap anggap user tidak punya profil
          setProfile(null);
        } else {
          setProfile(profileData);
        }
      } else {
        // Jika tidak ada sesi, pastikan profil juga null
        setProfile(null);
      }
      
      // 3. Setelah semua proses selesai, baru set loading ke false
      setLoading(false);
    };

    fetchSessionAndProfile();

    // Listener untuk memantau perubahan (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // Jika state berubah, jalankan lagi seluruh proses pengecekan
      setLoading(true); // Set loading lagi saat ada perubahan
      setSession(newSession);
      const newUser = newSession?.user;
      setUser(newUser ?? null);

      if (newUser) {
        supabase
          .from('users')
          .select('*')
          .eq('id', newUser.id)
          .single()
          .then(({ data, error }) => {
            if (error) {
              console.error('Error fetching profile on change:', error.message);
              setProfile(null);
            } else {
              setProfile(data);
            }
            setLoading(false);
          });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Fungsi sign-in, sign-up, sign-out tidak perlu diubah
  const signUp = async (email: string, password: string, name: string, role: 'admin' | 'user' = 'user') => {
    // ... kode sign up kamu sebelumnya ...
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
    // ... kode sign in kamu sebelumnya ...
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
    // Listener akan otomatis menghapus state
  };

  const value: AuthContextType = { user, session, profile, signUp, signIn, signOut, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
