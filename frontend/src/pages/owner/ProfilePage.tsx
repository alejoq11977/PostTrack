import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/api/auth.service';

export const ProfilePage = () => {
  const { user, reloadUser, logout } = useAuth();
  
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const[isUpdating, setIsUpdating] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

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
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mi Perfil</h1>

      {/* SECCIÓN 1: DATOS PERSONALES (Solo Lectura) */}
      <div className="bg-white shadow sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Información de la Cuenta</h3>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <p className="font-semibold text-gray-900">Nombre Completo</p>
              <p>{user.full_name}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Correo Electrónico</p>
              <p>{user.email}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Identificación</p>
              <p>{user.identification_number}</p>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: DATOS DE CONTACTO (Editables) */}
      <div className="bg-white shadow sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Datos de Contacto</h3>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Teléfono Celular</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                placeholder="Ej. 300 123 4567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Dirección de Residencia</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                placeholder="Ej. Calle 123 #45-67"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isUpdating}
                className="bg-brand-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
              >
                {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* SECCIÓN 3: ZONA DE PELIGRO */}
      <div className="bg-red-50 shadow sm:rounded-lg border border-red-200">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-red-800">Zona de Peligro</h3>
          <div className="mt-2 max-w-xl text-sm text-red-700">
            <p>
              Al revocar tu consentimiento, perderás el acceso a PostTrack de forma permanente. 
              Por normativa veterinaria legal (ley 576 del 2000), tus registros clínicos se conservarán bajo custodia, pero no se usarán para otros fines.
            </p>
          </div>
          <div className="mt-5">
            <button
              type="button"
              onClick={handleDeactivate}
              disabled={isDeactivating}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm"
            >
              {isDeactivating ? 'Procesando...' : 'Revocar Acceso y Eliminar Cuenta'}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};