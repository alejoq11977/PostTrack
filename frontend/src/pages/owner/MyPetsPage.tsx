import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Activity } from 'lucide-react';
import { patientsService } from '@/features/patients/api/patients.service';
import { Patient } from '@/features/patients/types/patient.model';

export const MyPetsPage = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const[isLoading, setIsLoading] = useState(true);
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
  },[]);

  if (isLoading) return <div className="animate-pulse h-32 w-full bg-slate-200 rounded-xl"></div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[26px] font-display text-slate-800 mb-1.5">Mis Mascotas</h1>
        <p className="text-slate-500 text-[14.5px]">Seleccione una mascota para ver sus seguimientos postoperatorios.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {patients.map((patient) => {
          const hasActiveMonitorings = patient.monitorings?.some(m => m.status === 'ACTIVE');

          return (
            <div 
              key={patient.id} 
              onClick={() => navigate(`/pets/${patient.id}`)}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:border-brand-400 hover:shadow-md cursor-pointer transition-all flex items-center justify-between group"
            >
              <div>
                <h3 className="text-[17px] font-bold text-slate-800">{patient.name}</h3>
                <p className="text-[13.5px] text-slate-500 mt-0.5">{patient.species} • {patient.breed}</p>
                
                {hasActiveMonitorings && (
                  <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-600 text-[11.5px] font-semibold border border-amber-200">
                    <Activity size={14} /> En recuperación
                  </div>
                )}
              </div>
              
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-500 transition-colors">
                <ChevronRight size={20} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};