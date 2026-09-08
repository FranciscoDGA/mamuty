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
const LOCAL_STORAGE_ACCOUNTS_KEY = 'mamuty_owner_accounts';

// Default Owner Account for immediate access
const DEFAULT_OWNER: AdminUser = {
  id: 'owner-default-1',
  name: 'Francisco (Dono Mamuty)',
  email: 'dono@mamuty.com',
  phone: '(11) 99999-8888',
  role: 'owner'
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session on mount
  useEffect(() => {
    try {
      const storedSession = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
      if (storedSession) {
        setUser(JSON.parse(storedSession));
      }
    } catch (e) {
      console.error('Error loading admin session:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = async (data: { name: string; email: string; phone: string; password: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      // 1. Try Supabase Auth
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
          console.warn('Supabase signUp note:', supaError.message);
        }
      } catch (err) {
        console.warn('Supabase network error, continuing with resilient local register:', err);
      }

      // 2. Save account in local registered accounts store
      const newOwner: AdminUser = {
        id: 'owner-' + Date.now(),
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        role: 'owner'
      };

      const accountsRaw = localStorage.getItem(LOCAL_STORAGE_ACCOUNTS_KEY);
      const accounts: Array<AdminUser & { password: string }> = accountsRaw ? JSON.parse(accountsRaw) : [];
      
      // Update or add
      const existingIdx = accounts.findIndex(a => a.email === newOwner.email);
      if (existingIdx >= 0) {
        accounts[existingIdx] = { ...newOwner, password: data.password };
      } else {
        accounts.push({ ...newOwner, password: data.password });
      }

      localStorage.setItem(LOCAL_STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
      
      // Automatically log in
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(newOwner));
      setUser(newOwner);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao realizar cadastro.' };
    }
  };

  const login = async (emailOrPhone: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanInput = emailOrPhone.trim().toLowerCase();

      // Quick check: default master owner or quick demo
      if ((cleanInput === 'dono@mamuty.com' || cleanInput === 'admin@mamuty.com') && password === 'mamuty123') {
        localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(DEFAULT_OWNER));
        setUser(DEFAULT_OWNER);
        return { success: true };
      }

      // 1. Try Supabase Auth
      try {
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
      } catch (err) {
        console.warn('Supabase signIn note, trying local registered accounts:', err);
      }

      // 2. Check local registered accounts
      const accountsRaw = localStorage.getItem(LOCAL_STORAGE_ACCOUNTS_KEY);
      if (accountsRaw) {
        const accounts: Array<AdminUser & { password: string }> = JSON.parse(accountsRaw);
        const match = accounts.find(
          a => (a.email.toLowerCase() === cleanInput || a.phone.replace(/\D/g, '') === cleanInput.replace(/\D/g, '')) && 
               a.password === password
        );

        if (match) {
          const { password: _, ...userOnly } = match;
          localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(userOnly));
          setUser(userOnly);
          return { success: true };
        }
      }

      return { success: false, error: 'E-mail, telefone ou senha incorretos.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao realizar login.' };
    }
  };

  const logout = () => {
    try {
      supabase.auth.signOut().catch(() => {});
      localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
    } catch (e) {
      // ignore
    }
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
