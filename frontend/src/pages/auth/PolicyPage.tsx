import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { clinicService } from '@/features/clinics/api/clinic.service';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { DataPolicy } from '@/features/clinics/types/clinic.model';

export const PolicyPage = () => {
  const [searchParams] = useSearchParams();
  const policyId = searchParams.get('policy_id');
  const clinicId = searchParams.get('clinica_id');
  const { user, logout } = useAuth();

  const [policy, setPolicy] = useState<DataPolicy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    await logout();
  };

  useEffect(() => {
    const loadPolicy = async () => {
      if (!policyId && !clinicId) {
        setError('ID de política o clínica no proporcionado');
        setIsLoading(false);
        return;
      }

      try {
        if (policyId) {
          const data = await clinicService.getPolicy(parseInt(policyId, 10));
          setPolicy(data);
        } else if (clinicId) {
          const pendingData = await clinicService.getPendingTerms(parseInt(clinicId, 10));
          if (pendingData.policy) {
            setPolicy(pendingData.policy);
          } else {
            setError('No hay política de tratamiento de datos disponible para esta clínica.');
          }
        }
      } catch (err) {
        setError('Error al cargar la política de tratamiento de datos');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPolicy();
  }, [clinicId, policyId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 max-w-3xl">
          <div className="text-red-600 text-center">{error}</div>
          <div className="mt-4 text-center">
            <Link to="/accept-terms" className="text-brand-600 hover:text-brand-700">
              Volver a términos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      {user && (
        <button
          onClick={handleLogout}
          className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors z-10"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      )}
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              POLÍTICA DE TRATAMIENTO Y PROTECCIÓN DE DATOS PERSONALES
            </h1>
            {policy && (
              <p className="text-sm text-gray-500 mb-6">
                Versión {policy.version} · Vigente desde {policy.effective_date}
              </p>
            )}
            <div className="prose prose-sm max-w-none text-gray-700">
              <div style={{ whiteSpace: 'pre-wrap' }}>{policy?.content}</div>
            </div>
            <div className="mt-6">
              <Link
                to={`/accept-terms?clinica_id=${clinicId || policy?.clinic}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-600 hover:bg-brand-700"
              >
                Volver a Términos
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
