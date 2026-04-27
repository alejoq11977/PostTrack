import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/shared/api/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { usePrivacyPolicy } from '@/features/auth/hooks/usePrivacyPolicy';

export const AcceptTermsPage = () => {
  const [isAccepted, setIsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { reloadUser } = useAuth();
  const { policy, isLoading: isPolicyLoading, error: policyError } = usePrivacyPolicy();
  const navigate = useNavigate();

  const handleAccept = async () => {
    if (!isAccepted || !policy) return;

    setIsLoading(true);
    try {
      await apiClient.post('/users/accept-terms/', {
        policy_id: policy.id,      
      });
      await reloadUser();
      navigate('/');
    } catch (error) {
      console.error('Error al aceptar los términos', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-2">
          Aviso de Privacidad
        </h2>
        <p className="text-center text-sm text-gray-600 mb-8">
          Cumplimiento de la Ley 1581 de 2012 (Habeas Data)
        </p>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="prose prose-sm text-gray-700 h-64 overflow-y-auto mb-6 p-4 border border-gray-200 rounded-md bg-slate-50">
            {isPolicyLoading && <p className="text-gray-400">Cargando aviso...</p>}
            {policyError && <p className="text-red-500">{policyError}</p>}
            {policy && (
              <>
                <p className="text-xs text-gray-400 mb-4">
                  Versión {policy.version} · Vigente desde {policy.effective_date}
                </p>
                <div style={{ whiteSpace: 'pre-wrap' }}>{policy.content}</div>
              </>
            )}
          </div>

          <div className="flex items-start mb-6">
            <div className="flex items-center h-5">
              <input
                id="terms"
                type="checkbox"
                checked={isAccepted}
                onChange={(e) => setIsAccepted(e.target.checked)}
                disabled={!policy}
                className="focus:ring-brand-500 h-5 w-5 text-brand-600 border-gray-300 rounded cursor-pointer"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="terms" className="font-medium text-gray-700 cursor-pointer">
                He leído y acepto el Aviso de Privacidad
              </label>
              <p className="text-gray-500">
                Autorizo el tratamiento de mis datos personales según las finalidades descritas.
              </p>
            </div>
          </div>

          <button
            onClick={handleAccept}
            disabled={!isAccepted || isLoading || !policy}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
              ${isAccepted && !isLoading && policy ? 'bg-brand-600 hover:bg-brand-700' : 'bg-gray-300 cursor-not-allowed'} 
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors duration-200`}
          >
            {isLoading ? 'Guardando...' : 'Aceptar y Continuar'}
          </button>
        </div>
      </div>
    </div>
  );
};