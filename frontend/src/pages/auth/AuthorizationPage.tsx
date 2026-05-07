import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { clinicService } from '@/features/clinics/api/clinic.service';
import { DataAuthorization } from '@/features/clinics/types/clinic.model';

export const AuthorizationPage = () => {
  const [searchParams] = useSearchParams();
  const authorizationId = searchParams.get('authorization_id');
  const clinicId = searchParams.get('clinica_id');

  const [authorization, setAuthorization] = useState<DataAuthorization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAuthorization = async () => {
      if (!authorizationId && !clinicId) {
        setError('ID de autorización o clínica no proporcionado');
        setIsLoading(false);
        return;
      }

      try {
        if (authorizationId) {
          const data = await clinicService.getAuthorization(parseInt(authorizationId, 10));
          setAuthorization(data);
        } else if (clinicId) {
          const pendingData = await clinicService.getPendingTerms(parseInt(clinicId, 10));
          if (pendingData.authorization) {
            setAuthorization(pendingData.authorization);
          } else {
            setError('No hay autorización de tratamiento de datos disponible para esta clínica.');
          }
        }
      } catch (err) {
        setError('Error al cargar la autorización de tratamiento de datos');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthorization();
  }, [clinicId, authorizationId]);

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
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              AUTORIZACIÓN PARA EL TRATAMIENTO DE DATOS PERSONALES
            </h1>
            {authorization && (
              <p className="text-sm text-gray-500 mb-6">
                Versión {authorization.version} · Vigente desde {authorization.effective_date}
              </p>
            )}
            <div className="prose prose-sm max-w-none text-gray-700">
              <div style={{ whiteSpace: 'pre-wrap' }}>{authorization?.content}</div>
            </div>
            <div className="mt-6">
              <Link
                to={`/accept-terms?clinica_id=${clinicId || authorization?.clinic}`}
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
