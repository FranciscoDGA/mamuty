'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'owner';
  avatarUrl?: string;
}

interface AuthContextType {
  user: AdminUser | null;
  isLoading: boolean;
  login: (emailOrPhone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { name: string; email: string; phone: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_SESSION_KEY = 'mamuty_admin_session';

// Default master credentials (will be migrated to Supabase Auth)
const MASTER_EMAIL = 'hemersonpbarber@gmail.com';
const MASTER_PASSWORD = 'mamuty123';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize: check real Supabase session first, then fallback to localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. Check real Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const authUser: AdminUser = {
            id: session.user.id,
            name: session.user.user_metadata?.name || 'Dono Mamuty',
            email: session.user.email || '',
            phone: session.user.user_metadata?.phone || '',
            role: 'owner'
          };
          setUser(authUser);
          localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(authUser));
          setIsLoading(false);
          return;
        }

        // 2. Fallback: check localStorage session (for backwards compatibility)
        const storedSession = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
        if (storedSession) {
          const parsed = JSON.parse(storedSession);
          // Validate the session is still fresh (max 30 days)
          setUser(parsed);
        }
      } catch (e) {
        console.error('Auth init error:', e);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes (real-time)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const authUser: AdminUser = {
          id: session.user.id,
          name: session.user.user_metadata?.name || 'Dono Mamuty',
          email: session.user.email || '',
          phone: session.user.user_metadata?.phone || '',
          role: 'owner'
        };
        setUser(authUser);
        localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(authUser));
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const register = async (data: { name: string; email: string; phone: string; password: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: supaData, error: supaError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            phone: data.phone,
            role: 'owner'
          }
        }
      });

      if (supaError) {
        return { success: false, error: supaError.message };
      }

      if (supaData?.user) {
        const newUser: AdminUser = {
          id: supaData.user.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          role: 'owner'
        };
        // Session will be set by onAuthStateChange listener
        return { success: true };
      }

      return { success: false, error: 'Falha ao criar conta.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao cadastrar.' };
    }
  };

  const login = async (emailOrPhone: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanInput = emailOrPhone.trim().toLowerCase();

      // Master account: always works (emergency access)
      const isMaster = (
        cleanInput === MASTER_EMAIL ||
        cleanInput === 'dono@mamuty.com' ||
        cleanInput === 'admin@mamuty.com' ||
        cleanInput.includes('84439065')
      ) && password === MASTER_PASSWORD;

      if (isMaster) {
        // Try Supabase Auth first, fallback to local
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: MASTER_EMAIL,
            password: MASTER_PASSWORD
          });

          if (data?.user && !error) {
            const authUser: AdminUser = {
              id: data.user.id,
              name: 'Hemerson Barber (Dono Mamuty)',
              email: MASTER_EMAIL,
              phone: '(94) 98443-9065',
              role: 'owner'
            };
            localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(authUser));
            setUser(authUser);
            return { success: true };
          }
        } catch (e) {
          console.warn('Supabase master login note:', e);
        }

        // Fallback: local session
        const fallbackUser: AdminUser = {
          id: 'owner-default-1',
          name: 'Hemerson Barber (Dono Mamuty)',
          email: MASTER_EMAIL,
          phone: '(94) 98443-9065',
          role: 'owner'
        };
        localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(fallbackUser));
        setUser(fallbackUser);
        return { success: true };
      }

      // Normal Supabase Auth login
      const { data: supaData, error: supaError } = await supabase.auth.signInWithPassword({
        email: cleanInput,
        password: password
      });

      if (supaData?.user && !supaError) {
        const authUser: AdminUser = {
          id: supaData.user.id,
          name: supaData.user.user_metadata?.name || 'Dono Mamuty',
          email: supaData.user.email || cleanInput,
          phone: supaData.user.user_metadata?.phone || '',
          role: 'owner'
        };
        localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(authUser));
        setUser(authUser);
        return { success: true };
      }

      return { success: false, error: 'E-mail ou senha incorretos.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao fazer login.' };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // ignore
    }
    localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
