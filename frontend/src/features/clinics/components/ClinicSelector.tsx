import { useNavigate } from 'react-router-dom';
import { useClinic } from '@/features/clinics/context/ClinicContext';

export const ClinicSelector = () => {
  const { clinics, setActiveClinic, isLoading, error } = useClinic();
  const navigate = useNavigate();

  const handleSelectClinic = (clinicId: number) => {
    const clinic = clinics.find((c) => c.id === clinicId);
    if (clinic) {
      setActiveClinic(clinic);
      navigate('/');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-2">
          Selecciona una Clínica
        </h2>
        <p className="text-center text-sm text-gray-600 mb-8">
          Selecciona la clínica con la que deseas trabajar
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {clinics.length === 0 ? (
            <div className="text-center text-gray-500">
              <p>No tienes clínicas asociadas.</p>
              <p className="text-sm mt-2">Contacta al administrador para obtener acceso.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {clinics.map((clinic) => (
                <button
                  key={clinic.id}
                  onClick={() => handleSelectClinic(clinic.id)}
                  className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-brand-500 hover:bg-brand-50 transition-colors duration-200"
                >
                  <h3 className="text-lg font-semibold text-gray-900">{clinic.name}</h3>
                  <p className="text-sm text-gray-500">NIT: {clinic.nit}</p>
                  <p className="text-sm text-gray-500">{clinic.address}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
