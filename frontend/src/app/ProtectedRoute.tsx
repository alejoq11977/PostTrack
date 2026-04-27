import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';

export const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    if (location.pathname !== '/login') {
      return <Navigate to="/login" replace />;
    }
    return <Outlet />;
  }

  const hasAcceptedTerms = Boolean(user.terms_accepted_at);
  const hasChangedPassword = user.password_changed;

  if (!hasAcceptedTerms) {
    return location.pathname === '/accept-terms'
      ? <Outlet />
      : <Navigate to="/accept-terms" replace />;
  }

  if (!hasChangedPassword) {
    return location.pathname === '/complete-profile'
      ? <Outlet />
      : <Navigate to="/complete-profile" replace />;
  }

  if (
    location.pathname === '/accept-terms' ||
    location.pathname === '/complete-profile'
  ) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};