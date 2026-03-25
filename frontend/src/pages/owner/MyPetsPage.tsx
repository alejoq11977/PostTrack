import { useNavigate } from 'react-router-dom';
import { useMyPets } from '@/features/patients/hooks/useMyPets';
import { PetCard } from '@/features/patients/components/PetCard';

export const MyPetsPage = () => {
  const { patients, isLoading } = useMyPets();
  const navigate = useNavigate();

  if (isLoading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2].map(i => (
        <div key={i} className="animate-pulse rounded-xl bg-slate-100 aspect-[4/3]" />
      ))}
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-[24px] font-display font-semibold text-slate-800 tracking-tight">
          Mis Mascotas
        </h1>
        <p className="text-slate-400 text-[13px] mt-1">
          Seleccione una mascota para ver sus seguimientos postoperatorios.
        </p>
      </div>

      {patients.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <p className="text-slate-500">No tiene mascotas registradas actualmente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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