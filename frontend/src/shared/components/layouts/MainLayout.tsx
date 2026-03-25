import { useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Logo } from '../common/Logo';
import { LogOut, Home, Users, AlertCircle, Menu, X } from 'lucide-react';

export const MainLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isVet = user?.role === 'VETERINARIAN' || user?.role === 'ADMIN';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinks = isVet ? (
    <>
      <Link
        to="/"
        onClick={() => setMenuOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
          isActive('/') ? 'bg-brand-50 text-brand-600' : 'text-slate-500 hover:bg-slate-50'
        }`}
      >
        <Users size={20} /> Mis Pacientes
      </Link>
      <Link
        to="/alerts"
        onClick={() => setMenuOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
          isActive('/alerts') ? 'bg-brand-50 text-brand-600' : 'text-slate-500 hover:bg-slate-50'
        }`}
      >
        <AlertCircle size={20} /> Alertas (Mora)
      </Link>
    </>
  ) : (
    <Link
      to="/"
      onClick={() => setMenuOpen(false)}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
        isActive('/') ? 'bg-brand-50 text-brand-600' : 'text-slate-500 hover:bg-slate-50'
      }`}
    >
      <Home size={20} /> Mis Mascotas
    </Link>
  );

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">

      {/* Overlay para cerrar el menú mobile */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 px-6 py-8 h-full">
        <div className="flex justify-center mb-10">
          <Link to="/" className="border border-slate-300 px-4 py-3 rounded-xl shadow-md">
            <Logo className="w-40 h-auto" />
          </Link>
        </div>

        <nav className="flex-1 flex flex-col gap-2 overflow-y-auto">
          {navLinks}
        </nav>

        <div className="pt-6 border-t border-slate-200 mt-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold uppercase">
              {user?.full_name?.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-800 truncate">{user?.full_name}</p>
              <p className="text-[11px] font-medium text-slate-500 truncate">
                {user?.role === 'OWNER' ? 'Propietario' : 'Veterinario'}
              </p>
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

      {/* Drawer mobile */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white border-r border-slate-200 px-6 py-8 z-30 flex flex-col
          transform transition-transform duration-300 ease-in-out md:hidden
          ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Botón cerrar */}
        <button
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600"
          onClick={() => setMenuOpen(false)}
        >
          <X size={22} />
        </button>

        {/* Logo igual al desktop */}
        <div className="flex justify-center mb-10">
          <Link to="/" onClick={() => setMenuOpen(false)} className="border border-slate-300 px-4 py-3 rounded-xl shadow-md">
            <Logo className="w-40 h-auto" />
          </Link>
        </div>

        <nav className="flex-1 flex flex-col gap-2 overflow-y-auto">
          {navLinks}
        </nav>

        <div className="pt-6 border-t border-slate-200 mt-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold uppercase">
              {user?.full_name?.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-800 truncate">{user?.full_name}</p>
              <p className="text-[11px] font-medium text-slate-500 truncate">
                {user?.role === 'OWNER' ? 'Propietario' : 'Veterinario'}
              </p>
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

      {/* Main */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">

        {/* Topbar mobile */}
        <div className="md:hidden flex items-center justify-between bg-white border-b border-slate-200 px-4 py-3">
          <button
            onClick={() => setMenuOpen(true)}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Abrir menú"
          >
            <Menu size={22} />
          </button>

          {/* Logo centrado igual al sidebar */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <Link to="/" className="border border-slate-300 px-3 py-2 rounded-xl shadow-md block">
              <Logo className="w-28 h-auto" />
            </Link>
          </div>

          {/* Espacio a la derecha para balance visual */}
          <div className="w-10" />
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-5xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};