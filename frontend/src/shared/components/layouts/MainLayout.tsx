import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Logo } from '../common/Logo';
import { LogOut, Home, FileText, Users, AlertCircle } from 'lucide-react';

export const MainLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isVet = user?.role === 'VETERINARIAN' || user?.role === 'ADMIN';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Izquierdo */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 px-6 py-8">
        <Logo className="w-32 h-auto mb-10" showText={true} />
        
        <nav className="flex-1 flex flex-col gap-2">
          {isVet ? (
            /* Menú del Veterinario */
            <>
              <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-brand-50 text-brand-600 font-medium">
                <Users size={20} /> Mis Pacientes
              </Link>
              <Link to="/alerts" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors">
                <AlertCircle size={20} /> Alertas (Mora)
              </Link>
            </>
          ) : (
            /* Menú del Propietario */
            <>
              <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-brand-50 text-brand-600 font-medium">
                <Home size={20} /> Mis Mascotas
              </Link>
              <Link to="/history" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors">
                <FileText size={20} /> Historial
              </Link>
            </>
          )}
        </nav>

        {/* Perfil y Logout */}
        <div className="pt-6 border-t border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold uppercase">
              {user?.full_name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-800 truncate">{user?.full_name}</p>
              <p className="text-[11px] font-medium text-slate-500 truncate">{user?.role === 'OWNER' ? 'Propietario' : 'Veterinario'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
          >
            <LogOut size={18} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 overflow-y-auto">
        <div className="md:hidden flex items-center justify-between bg-white border-b border-slate-200 px-4 py-4">
          <Logo className="w-24 h-auto" showText={true} />
          <button onClick={handleLogout} className="p-2 text-slate-500">
            <LogOut size={20} />
          </button>
        </div>
        
        <div className="p-6 md:p-10 max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};