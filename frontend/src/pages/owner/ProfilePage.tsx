import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useClinic } from '@/features/clinics/context/ClinicContext';
import { authService } from '@/features/auth/api/auth.service';
import { User, Mail, CreditCard, Phone, AlertTriangle } from 'lucide-react';

export const ProfilePage = () => {
  const { user, reloadUser, logout } = useAuth();
  const { activeClinic } = useClinic();

  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  // Re-fetch the profile scoped to the active clinic (each clinic keeps its own
  // copy). Without this, "Mi perfil" would show the stale login-time data and
  // not reflect what a vet edited for this clinic, nor switch when the clinic changes.
  useEffect(() => {
    if (activeClinic?.id) {
      reloadUser();
    }
  }, [activeClinic?.id]);

  useEffect(() => {
    if (user) {
      setPhone(user.phone_number || '');
      setAddress(user.address || '');
    }
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await authService.updateProfile({ phone_number: phone, address: address });
      await reloadUser();
      alert("Perfil actualizado correctamente.");
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      alert("Ocurrió un error al actualizar los datos.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeactivate = async () => {
    const confirmDelete = window.confirm(
      "⚠️ ZONA DE PELIGRO\n\n¿Estás seguro de que deseas eliminar tu cuenta y revocar tu acceso?\n\nPerderás acceso al sistema inmediatamente, pero ten en cuenta que tu historial clínico será conservado por la clínica veterinaria por exigencia legal."
    );

    if (confirmDelete) {
      setIsDeactivating(true);
      try {
        await authService.deactivateAccount();
        await logout();
      } catch (error) {
        console.error("Error desactivando la cuenta:", error);
        alert("Hubo un problema al intentar desactivar tu cuenta.");
        setIsDeactivating(false);
      }
    }
  };

  if (!user) return null;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-[24px] font-display font-semibold text-slate-800 tracking-tight">
          Mi Perfil
        </h1>
        <p className="text-slate-400 text-[13px] mt-1">
          Gestiona tu información personal y preferencias
        </p>
      </div>

      {/* Avatar Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-2xl font-bold uppercase">
          {user.full_name?.charAt(0)}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-800">{user.full_name}</h2>
          <p className="text-sm text-slate-500">{user.role === 'OWNER' ? 'Propietario' : 'Veterinario'}</p>
        </div>
      </div>

      {/* SECCIÓN 1: DATOS PERSONALES */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h3 className="text-base font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <User size={18} className="text-slate-400" />
          Información de la Cuenta
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
              <User size={16} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 mb-0.5">Nombre Completo</p>
              <p className="text-sm font-medium text-slate-800">{user.full_name}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
              <Mail size={16} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 mb-0.5">Correo Electrónico</p>
              <p className="text-sm font-medium text-slate-800">{user.email}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
              <CreditCard size={16} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 mb-0.5">Identificación</p>
              <p className="text-sm font-medium text-slate-800">{user.identification_number}</p>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: DATOS DE CONTACTO */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h3 className="text-base font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Phone size={18} className="text-slate-400" />
          Datos de Contacto
        </h3>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Teléfono Celular</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              placeholder="Ej. 300 123 4567"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Dirección de Residencia</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              placeholder="Ej. Calle 123 #45-67"
            />
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isUpdating}
              className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isUpdating ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* SECCIÓN 3: ZONA DE PELIGRO */}
      <div className="bg-red-50 rounded-xl border border-red-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600 shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-red-800 mb-1">Zona de Peligro</h3>
            <p className="text-sm text-red-700 mb-4 leading-relaxed">
              Al revocar tu consentimiento, perderás el acceso a PostTrack de forma permanente.
              Por normativa veterinaria legal (ley 576 del 2000), tus registros clínicos se conservarán bajo custodia, pero no se usarán para otros fines.
            </p>
            <button
              type="button"
              onClick={handleDeactivate}
              disabled={isDeactivating}
              className="px-4 py-2 border border-red-300 text-red-700 text-sm font-medium rounded-lg bg-white hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isDeactivating ? (
                <>
                  <span className="w-4 h-4 border-2 border-red-300/50 border-t-red-600 rounded-full animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <AlertTriangle size={14} />
                  Revocar Acceso y Eliminar Cuenta
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};