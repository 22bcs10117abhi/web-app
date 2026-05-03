import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, getToken, setToken, User } from './api';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (data: { name: string; email: string; password: string; role: 'admin' | 'member' }) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = getToken();
    if (!t) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then((r) => setUser(r.user))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const login: AuthContextValue['login'] = async (email, password) => {
    const r = await api.login({ email, password });
    setToken(r.token);
    setUser(r.user);
    return r.user;
  };

  const signup: AuthContextValue['signup'] = async (data) => {
    const r = await api.signup(data);
    setToken(r.token);
    setUser(r.user);
    return r.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    const r = await api.me();
    setUser(r.user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
