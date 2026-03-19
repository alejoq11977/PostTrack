import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';

export const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();

  // Mientras Firebase y Django se comunican, mostramos un loader
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Si terminó de cargar y no hay usuario, lo echamos al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // RNF: Si el usuario es nuevo y no ha cambiado su contraseña, lo forzaremos 
  // a la pantalla de "Completar Perfil". Por ahora, si password_changed es false, 
  // lo dejamos pasar pero podríamos redirigirlo aquí:
  // if (!user.password_changed) return <Navigate to="/complete-profile" replace />;

  // Si todo está bien, mostramos la pantalla que solicitó (Outlet)
  return <Outlet />;
};