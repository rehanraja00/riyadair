import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setAuthToken } from '../api/client.js';

const AuthContext = createContext(null);
const STORAGE_KEY = 'econ_platform_token';

const ROLE_RANK = { VIEWER: 0, EDITOR: 1, ADMIN: 2 };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    setAuthToken(token);
    api
      .me()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem(STORAGE_KEY);
        setAuthToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, user: loggedInUser } = await api.login({ email, password });
    localStorage.setItem(STORAGE_KEY, token);
    setAuthToken(token);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const register = useCallback(async (email, password, name) => {
    const { token, user: newUser } = await api.register({ email, password, name });
    localStorage.setItem(STORAGE_KEY, token);
    setAuthToken(token);
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAuthToken(null);
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (minRole) => !!user && ROLE_RANK[user.role] >= ROLE_RANK[minRole],
    [user]
  );

  const value = useMemo(
    () => ({ user, loading, login, register, logout, hasRole }),
    [user, loading, login, register, logout, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
