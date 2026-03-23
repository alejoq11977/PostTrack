import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Activity } from 'lucide-react';
import { patientsService } from '@/features/patients/api/patients.service';
import { Patient } from '@/features/patients/types/patient.model';

export const MyPetsPage = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await patientsService.getPatients();
        setPatients(data);
      } catch (error) {
        console.error("Error cargando pacientes:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPatients();
  }, []);

  if (isLoading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2].map(i => (
        <div key={i} className="animate-pulse rounded-xl bg-slate-100 aspect-[4/3]" />
      ))}
    </div>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[24px] font-display font-semibold text-slate-800 tracking-tight">
          Mis Mascotas
        </h1>
        <p className="text-slate-400 text-[13px] mt-1">
          Seleccione una mascota para ver sus seguimientos postoperatorios.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {patients.map((patient) => {
          const hasActiveMonitorings = patient.monitorings?.some(m => m.status === 'ACTIVE');

          return (
            <div
              key={patient.id}
              onClick={() => navigate(`/pets/${patient.id}`)}
              className="
                group bg-white rounded-xl border border-slate-200
                overflow-hidden cursor-pointer
                hover:border-slate-300 hover:shadow-sm
                transition-all duration-150
              "
            >
              {/* ── FOTO PROTAGONISTA ── */}
              <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                {patient.photo_url ? (
                  <img
                    src={patient.photo_url}
                    alt={patient.name}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100">
                    <span className="text-6xl opacity-30 select-none">
                      {patient.species === 'Felino' ? '🐈' : '🐕'}
                    </span>
                  </div>
                )}

                {/* Gradiente + nombre sobre la foto */}
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 px-4 pb-3 flex items-end justify-between">
                  <span className="text-white text-[17px] font-semibold tracking-tight drop-shadow-sm">
                    {patient.name}
                  </span>
                  {hasActiveMonitorings && (
                    <span className="inline-flex items-center gap-1.5 bg-amber-400/90 text-amber-950 text-[10.5px] font-semibold px-2 py-1 rounded-md">
                      <Activity size={10} strokeWidth={2.5} />
                      En recuperación
                    </span>
                  )}
                </div>
              </div>

              {/* ── INFO INFERIOR ── */}
              <div className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-[13px] text-slate-500">{patient.breed}</p>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {patient.species}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:border-brand-300 group-hover:text-brand-500 transition-colors">
                    <ChevronRight size={13} strokeWidth={2} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};