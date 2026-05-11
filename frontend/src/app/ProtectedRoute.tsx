import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useClinic } from '@/features/clinics/context/ClinicContext';
import { clinicService } from '@/features/clinics/api/clinic.service';

export const ProtectedRoute = () => {
  const { user, isLoading: isAuthLoading, logout } = useAuth();
  const { clinics, activeClinic, isLoading: isClinicLoading, isInitialized } = useClinic();
  const location = useLocation();
  const navigate = useNavigate();

  const [pendingTerms, setPendingTerms] = useState<{ clinic_id: number } | null>(null);
  const checkingRef = useRef(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isAuthRoute = location.pathname === '/login';
  const isForgotPasswordRoute = location.pathname === '/forgot-password';
  const isAcceptTermsRoute = location.pathname === '/accept-terms';
  const isCompleteProfileRoute = location.pathname === '/complete-profile';
  const isSelectClinicRoute = location.pathname === '/select-clinic';
  const isPolicyRoute = location.pathname === '/politica-datos';
  const isAuthorizationRoute = location.pathname === '/autorizacion-datos';

  const isVetPath = location.pathname.startsWith('/vet') || location.pathname === '/alerts';
  const isOwnerPath = ['/', '/pets', '/report', '/history', '/form-result'].some(p => location.pathname === p || location.pathname.startsWith(p + '/'));

  useEffect(() => {
    if (!user || !activeClinic) return;

    if (isAuthRoute || isForgotPasswordRoute || isCompleteProfileRoute || isAcceptTermsRoute || isSelectClinicRoute || isPolicyRoute || isAuthorizationRoute) {
      return;
    }

    if (checkingRef.current) return;
    checkingRef.current = true;

    clinicService.getPendingTerms(activeClinic.id)
      .then(data => {
        setPendingTerms(data.needs_acceptance ? { clinic_id: activeClinic.id } : null);
      })
      .catch(err => {
        console.error('Error checking pending terms:', err);
        setPendingTerms(null);
      })
      .finally(() => {
        checkingRef.current = false;
      });
  }, [user, activeClinic, location.pathname, isAuthRoute, isForgotPasswordRoute, isCompleteProfileRoute, isAcceptTermsRoute, isSelectClinicRoute, isPolicyRoute, isAuthorizationRoute]);

  if (isAuthLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    if (!isAuthRoute) {
      return <Navigate to="/login" replace />;
    }
    return <Outlet />;
  }

  if (!user.password_changed) {
    return isCompleteProfileRoute
      ? <Outlet />
      : <Navigate to="/complete-profile" replace />;
  }

  if (isCompleteProfileRoute) {
    return <Navigate to="/" replace />;
  }

  if (clinics.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 relative">
        <button
          onClick={handleLogout}
          className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors z-10"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 max-w-md">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Sin acceso a clínicas</h2>
          <p className="text-gray-600">
            No tienes clínicas asociadas. Contacta al administrador para obtener acceso.
          </p>
        </div>
      </div>
    );
  }

  const hasOnlyOneClinic = clinics.length === 1;

  if (!activeClinic) {
    if (isSelectClinicRoute) {
      return <Outlet />;
    }
    if (isPolicyRoute || isAuthorizationRoute) {
      return <Outlet />;
    }
    if (hasOnlyOneClinic) {
      return <Outlet />;
    }
    return <Navigate to="/select-clinic" replace />;
  }

  if (isSelectClinicRoute) {
    if (hasOnlyOneClinic) {
      return <Navigate to="/" replace />;
    }
    return <Outlet />;
  }

  const isVet = user.role === 'VETERINARIAN' || user.role === 'ADMIN';
  if (isVetPath && !isVet) {
    return <Navigate to="/" replace />;
  }
  if (isOwnerPath && isVet) {
    return <Navigate to="/vet/dashboard" replace />;
  }

  if (pendingTerms && !isAcceptTermsRoute && !isPolicyRoute && !isAuthorizationRoute) {
    return <Navigate to={`/accept-terms?clinica_id=${pendingTerms.clinic_id}`} replace />;
  }

  return <Outlet />;
};