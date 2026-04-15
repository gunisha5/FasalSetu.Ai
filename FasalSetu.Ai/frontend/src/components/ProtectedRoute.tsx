import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface Props {
  allowedRole?: 'FARMER' | 'AGENT';
}

/**
 * Wraps protected routes.
 * If the user is unauthenticated they are sent back to /login.
 * If a specific role is required and doesn't match they are redirected to /unauthorized.
 */
export default function ProtectedRoute({ allowedRole }: Props) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user?.role !== allowedRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
