import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { FullPageSpinner } from '../components/Spinner';
import { useAuth } from '../hooks/useAuth';
import type { Role } from '../types';
import { ROLE_HOME } from '../utils/status';

interface ProtectedRouteProps {
  /** Roles allowed to see the route. Omit to allow any authenticated user. */
  roles?: Role[];
  children: ReactNode;
}

export function ProtectedRoute({ roles, children }: ProtectedRouteProps) {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === 'checking') return <FullPageSpinner label="Checking your session…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to={ROLE_HOME[user.role]} replace />;
  return <>{children}</>;
}

/** For /login: an authenticated visitor is sent to their home page. */
export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { user, status } = useAuth();
  if (status === 'checking') return <FullPageSpinner label="Checking your session…" />;
  if (user) return <Navigate to={ROLE_HOME[user.role]} replace />;
  return <>{children}</>;
}

export function RoleHomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? ROLE_HOME[user.role] : '/login'} replace />;
}
