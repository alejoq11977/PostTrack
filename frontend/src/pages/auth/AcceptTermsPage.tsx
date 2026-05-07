import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { clinicService } from '@/features/clinics/api/clinic.service';
import { useClinic } from '@/features/clinics/context/ClinicContext';
import { DataPolicy, DataAuthorization, ClinicMinimal } from '@/features/clinics/types/clinic.model';

export const AcceptTermsPage = () => {
  const [searchParams] = useSearchParams();
  const clinicIdParam = searchParams.get('clinica_id');
  const clinicId = clinicIdParam ? parseInt(clinicIdParam, 10) : null;

  const [clinic, setClinic] = useState<ClinicMinimal | null>(null);
  const [policy, setPolicy] = useState<DataPolicy | null>(null);
  const [authorization, setAuthorization] = useState<DataAuthorization | null>(null);
  const [isAccepted, setIsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { activeClinic, setActiveClinic } = useClinic();
  const navigate = useNavigate();

  useEffect(() => {
    const loadTerms = async () => {
      if (!clinicId) {
        setError('ID de clínica no proporcionado');
        setIsLoading(false);
        return;
      }

      try {
        const pendingData = await clinicService.getPendingTerms(clinicId);
        setClinic(pendingData.clinic);
        setPolicy(pendingData.policy);
        setAuthorization(pendingData.authorization);

        if (!pendingData.needs_acceptance) {
          navigate('/');
        }
      } catch (err) {
        setError('Error al cargar los términos');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadTerms();
  }, [clinicId, navigate]);

  const handleAccept = async () => {
    if (!isAccepted || !clinicId) return;

    setIsSubmitting(true);
    try {
      await clinicService.acceptTerms({
        clinic_id: clinicId,
        policy_id: policy?.id,
        authorization_id: authorization?.id,
      });

      if (activeClinic?.id === clinicId) {
        navigate('/');
      } else {
        const clinics = await clinicService.getClinics();
        const selectedClinic = clinics.find((c) => c.id === clinicId);
        if (selectedClinic) {
          setActiveClinic(selectedClinic);
          navigate('/');
        } else {
          navigate('/select-clinic');
        }
      }
    } catch (err) {
      setError('Error al aceptar los términos');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewPolicy = () => {
    if (policy) {
      navigate(`/politica-datos?clinica_id=${clinicId}&policy_id=${policy.id}`);
    }
  };

  const handleViewAuthorization = () => {
    if (authorization) {
      navigate(`/autorizacion-datos?clinica_id=${clinicId}&authorization_id=${authorization.id}`);
    }
  };

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
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 max-w-md">
          <div className="text-red-600 text-center">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-2">
          Tratamiento de Datos Personales
        </h2>
        <p className="text-center text-sm text-gray-600 mb-8">
         Estás siendo atendido por <span className="font-semibold">{clinic?.name}</span>
        </p>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              Para continuar con el seguimiento clínico de tu mascota, es necesario autorizar el tratamiento de tus datos personales conforme a la normativa vigente.
            </p>
          </div>

          <div className="mb-4">
            <button
              onClick={handleViewPolicy}
              className="text-brand-600 hover:text-brand-700 font-medium underline bg-transparent border-none cursor-pointer"
            >
              POLÍTICA DE TRATAMIENTO Y PROTECCIÓN DE DATOS PERSONALES
            </button>
          </div>

          <div className="mb-6">
            <button
              onClick={handleViewAuthorization}
              className="text-brand-600 hover:text-brand-700 font-medium underline bg-transparent border-none cursor-pointer"
            >
              AUTORIZACIÓN PARA EL TRATAMIENTO DE DATOS PERSONALES
            </button>
          </div>

          <div className="flex items-start mb-6">
            <div className="flex items-center h-5">
              <input
                id="terms"
                type="checkbox"
                checked={isAccepted}
                onChange={(e) => setIsAccepted(e.target.checked)}
                disabled={!policy || !authorization}
                className="focus:ring-brand-500 h-5 w-5 text-brand-600 border-gray-300 rounded cursor-pointer"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="terms" className="font-medium text-gray-700 cursor-pointer">
                Autorizo de manera previa, expresa e informada el tratamiento de mis datos personales conforme a la Política de Tratamiento de Datos Personales y la Autorización para el Tratamiento de Datos, las cuales he leído y acepto.
              </label>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleAccept}
            disabled={!isAccepted || isSubmitting || !policy || !authorization}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
              ${isAccepted && !isSubmitting && policy && authorization ? 'bg-brand-600 hover:bg-brand-700' : 'bg-gray-300 cursor-not-allowed'}
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors duration-200`}
          >
            {isSubmitting ? 'Guardando...' : 'Aceptar y Continuar'}
          </button>
        </div>
      </div>
    </div>
  );
};
