// src/contexts/authContext.tsx
import { api } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

// mesmo papel do localStorage('userId') / ('isAdmin') do site
const STORAGE_KEY = '@soundy:user';

export type User = {
  id: string;
  name?: string;
  email?: string;
  isAdmin: boolean;
};

type AuthContextData = {
  user: User | null;
  loading: boolean; // true enquanto lê o AsyncStorage na abertura do app
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // equivalente ao "if (userId) vá pro menu" do script.js do site
  useEffect(() => {
    async function restore() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) setUser(JSON.parse(saved));
      } catch {
        // storage corrompido: segue deslogado
      } finally {
        setLoading(false);
      }
    }
    restore();
  }, []);

  async function persist(u: User) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    setUser(u);
  }

  async function signIn(email: string, password: string) {
    const data = await api<{ id: string; name?: string; email?: string; isAdmin?: boolean }>(
      '/users/login',
      { method: 'POST', body: JSON.stringify({ email: email.trim(), password }) },
    );
    await persist({
      id: data.id,
      name: data.name,
      email: data.email,
      isAdmin: data.isAdmin === true,
    });
  }

  async function signUp(name: string, email: string, password: string) {
    const data = await api<{ id: string; name?: string; email?: string }>('/users', {
      method: 'POST',
      body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
    });
    await persist({ id: data.id, name: data.name ?? name, email: data.email ?? email, isAdmin: false });
  }

  async function signOut() {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);