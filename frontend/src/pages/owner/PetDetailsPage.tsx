import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { usePetDetails } from '@/features/patients/hooks/usePetDetails';
import { PetAvatar } from '@/features/patients/components/PetAvatar';
import { MonitoringCard } from '@/features/monitoring/components/MonitoringCard';

export const PetDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { patient, isLoading } = usePetDetails(id);

  if (isLoading) return (
    <div className="animate-pulse space-y-6">
      <div className="h-6 w-32 bg-slate-200 rounded"></div>
      <div className="flex gap-4 items-center">
        <div className="h-20 w-20 bg-slate-200 rounded-full"></div>
        <div className="h-10 w-48 bg-slate-200 rounded"></div>
      </div>
      <div className="h-40 w-full bg-slate-200 rounded-xl"></div>
    </div>
  );

  if (!patient) return (
    <div className="bg-white border border-slate-200 rounded-xl p-8 text-center mt-10">
      <p className="text-slate-500">Paciente no encontrado.</p>
      <button onClick={() => navigate('/')} className="mt-4 text-brand-500 font-semibold hover:underline">Volver a inicio</button>
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* Botón Volver */}
      <button 
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-[13.5px] font-medium text-slate-500 hover:text-brand-600 mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Volver a mis mascotas
      </button>

      {/* HEADER DE LA MASCOTA */}
      <div className="flex items-center gap-5 mb-8">
        <PetAvatar 
          photoUrl={patient.photo_url} 
          name={patient.name} 
          size="lg" 
          className="border-4 border-white shadow-md" 
        />
        <div>
          <h1 className="text-[26px] font-display font-semibold text-slate-800 mb-1 tracking-tight">{patient.name}</h1>
          <p className="text-slate-500 text-[14px]">Seguimientos postoperatorios asociados.</p>
        </div>
      </div>

      {/* LISTA DE CIRUGÍAS */}
      {!patient.monitorings || patient.monitorings.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <p className="text-slate-500">No hay historial de cirugías para {patient.name}.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {patient.monitorings.map((monitoring) => (
            <MonitoringCard key={monitoring.id} monitoring={monitoring} />
          ))}
        </div>
      )}
    </div>
  );
};