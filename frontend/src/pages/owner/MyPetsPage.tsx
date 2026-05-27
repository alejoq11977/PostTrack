import { useNavigate } from 'react-router-dom';
import { useMyPets } from '@/features/patients/hooks/useMyPets';
import { PetCard } from '@/features/patients/components/PetCard';

export const MyPetsPage = () => {
  const { patients, isLoading } = useMyPets();
  const navigate = useNavigate();

if (isLoading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 max-w-[1400px] mx-auto">
      {[1, 2].map(i => (
        <div key={i} className="animate-pulse rounded-xl bg-slate-100 aspect-square" />
      ))}
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-semibold text-slate-800 tracking-tight">
          Mis Mascotas
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Seleccione una mascota para ver sus seguimientos postoperatorios.
        </p>
      </div>

      {patients.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <p className="text-slate-500">No tiene mascotas registradas actualmente.</p>
        </div>
      ) : (
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {patients.map((patient) => (
            <PetCard
              key={patient.id}
              patient={patient}
              onClick={() => navigate(`/pets/${patient.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};