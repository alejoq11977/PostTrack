import { useState } from 'react';
import { X, Lock } from 'lucide-react';
import { reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface ChangeClinicModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const ChangeClinicModal = ({ onClose, onSuccess }: ChangeClinicModalProps) => {
  const { firebaseUser } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Ingrese su contraseña');
      return;
    }

    if (!firebaseUser?.email) {
      setError('No se encontró el email del usuario');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const credential = EmailAuthProvider.credential(
        firebaseUser.email,
        password
      );
      await reauthenticateWithCredential(firebaseUser, credential);
      onSuccess();
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/wrong-password') {
        setError('Contraseña incorrecta');
      } else if (code === 'auth/user-mismatch') {
        setError('El usuario no coincide');
      } else {
        setError('Error al verificar credentials');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Lock size={20} className="text-brand-600" />
            <h2 className="text-lg font-semibold text-gray-900">Cambiar de clínica</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Ingrese su contraseña para cambiar de clínica
          </p>

          <div className="mb-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              autoFocus
            />
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Verificando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};