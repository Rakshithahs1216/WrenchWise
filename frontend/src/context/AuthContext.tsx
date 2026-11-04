import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import toast from 'react-hot-toast';
import { authApi } from '../api/auth';
import { setUnauthorizedHandler } from '../api/client';
import type { LoginInput, User } from '../types';

type AuthStatus = 'checking' | 'authenticated' | 'anonymous';

export interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  login: (input: LoginInput) => Promise<User>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('checking');

  const resetSession = useCallback(() => {
    setUser(null);
    setStatus('anonymous');
    queryClient.clear();
  }, [queryClient]);

  // Restore the session from the httpOnly cookie on first load.
  useEffect(() => {
    let cancelled = false;
    authApi
      .me()
      .then((me) => {
        if (cancelled) return;
        setUser(me);
        setStatus('authenticated');
      })
      .catch(() => {
        if (!cancelled) setStatus('anonymous');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Any 401 from a data request means the cookie expired: drop the session.
  // ProtectedRoute then redirects to /login, keeping the current location.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      toast.error('Your session has expired. Please sign in again.', { id: 'session-expired' });
      resetSession();
    });
    return () => setUnauthorizedHandler(null);
  }, [resetSession]);

  const login = useCallback(
    async (input: LoginInput) => {
      const loggedIn = await authApi.login(input);
      queryClient.clear();
      setUser(loggedIn);
      setStatus('authenticated');
      return loggedIn;
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      resetSession();
    }
  }, [resetSession]);

  const value = useMemo(() => ({ user, status, login, logout }), [user, status, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
