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
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { name: string; email: string; phone: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_SESSION_KEY = 'mamuty_admin_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          // Sessão inválida ou corrompida — limpar tudo
          setUser(null);
          localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
          await supabase.auth.signOut();
        } else if (session?.user) {
          const authUser: AdminUser = {
            id: session.user.id,
            name: session.user.user_metadata?.name || 'Admin',
            email: session.user.email || '',
            phone: session.user.user_metadata?.phone || '',
            role: 'owner'
          };
          setUser(authUser);
          localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(authUser));
        } else {
          // Sem sessão válida — limpar localStorage
          setUser(null);
          localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
        }
      } catch (e) {
        console.error('Auth init error:', e);
        setUser(null);
        localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const authUser: AdminUser = {
          id: session.user.id,
          name: session.user.user_metadata?.name || 'Admin',
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
        return { success: true };
      }

      return { success: false, error: 'Falha ao criar conta.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao cadastrar.' };
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanEmail = email.trim().toLowerCase();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password
      });

      if (error) {
        if (error.message.includes('Invalid login')) {
          return { success: false, error: 'E-mail ou senha incorretos.' };
        }
        return { success: false, error: error.message };
      }

      if (data?.user) {
        const authUser: AdminUser = {
          id: data.user.id,
          name: data.user.user_metadata?.name || 'Admin',
          email: data.user.email || cleanEmail,
          phone: data.user.user_metadata?.phone || '',
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
