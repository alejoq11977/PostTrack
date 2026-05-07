import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useClinic } from '@/features/clinics/context/ClinicContext';
import { clinicService } from '@/features/clinics/api/clinic.service';

export const ProtectedRoute = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { clinics, activeClinic, isLoading: isClinicLoading, isInitialized } = useClinic();
  const location = useLocation();

  const [pendingTerms, setPendingTerms] = useState<{ clinic_id: number } | null>(null);
  const [checkingTerms, setCheckingTerms] = useState(false);

  const isAuthRoute = location.pathname === '/login';
  const isAcceptTermsRoute = location.pathname === '/accept-terms';
  const isCompleteProfileRoute = location.pathname === '/complete-profile';
  const isSelectClinicRoute = location.pathname === '/select-clinic';
  const isPolicyRoute = location.pathname === '/politica-datos';
  const isAuthorizationRoute = location.pathname === '/autorizacion-datos';

  useEffect(() => {
    const checkPendingTerms = async () => {
      if (!user || !activeClinic || checkingTerms) return;

      if (isAuthRoute || isCompleteProfileRoute || isAcceptTermsRoute || isSelectClinicRoute || isPolicyRoute || isAuthorizationRoute) {
        return;
      }

      setCheckingTerms(true);
      try {
        const data = await clinicService.getPendingTerms(activeClinic.id);
        if (data.needs_acceptance) {
          setPendingTerms({ clinic_id: activeClinic.id });
        } else {
          setPendingTerms(null);
        }
      } catch (err) {
        console.error('Error checking pending terms:', err);
        setPendingTerms(null);
      } finally {
        setCheckingTerms(false);
      }
    };

    checkPendingTerms();
  }, [user, activeClinic, location.pathname, checkingTerms, isAuthRoute, isCompleteProfileRoute, isAcceptTermsRoute, isSelectClinicRoute, isPolicyRoute, isAuthorizationRoute]);

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
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

  if (pendingTerms && !isAcceptTermsRoute && !isPolicyRoute && !isAuthorizationRoute) {
    return <Navigate to={`/accept-terms?clinica_id=${pendingTerms.clinic_id}`} replace />;
  }

  return <Outlet />;
};