import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from '../context/AuthContext';

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

/** Narrowed accessor for pages rendered behind ProtectedRoute. */
export function useCurrentUser() {
  const { user } = useAuth();
  if (!user) throw new Error('useCurrentUser called without an authenticated user');
  return user;
}
