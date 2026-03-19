import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, FilePlus2, ArrowLeft, History, CheckCircle2 } from 'lucide-react';
import { patientsService } from '@/features/patients/api/patients.service';
import { Patient } from '@/features/patients/types/patient.model';
import { cn } from '@/shared/utils/cn';

export const PetDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);

  useEffect(() => {
    const fetchPatient = async () => {
      const data = await patientsService.getPatients();
      const selected = data.find(p => p.id === Number(id));
      if (selected) setPatient(selected);
    };
    fetchPatient();
  }, [id]);

  if (!patient) return null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-[13.5px] font-medium text-slate-500 hover:text-brand-600 mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Volver a mis mascotas
      </button>

      <div className="mb-8">
        <h1 className="text-[26px] font-display text-slate-800 mb-1.5">{patient.name}</h1>
        <p className="text-slate-500 text-[14.5px]">Historial de seguimientos postoperatorios.</p>
      </div>

      {!patient.monitorings || patient.monitorings.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <p className="text-slate-500">No hay historial de cirugías para {patient.name}.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {patient.monitorings.map((monitoring) => {
            const isActive = monitoring.status === 'ACTIVE';

            return (
              <div key={monitoring.id} className={cn(
                "bg-white rounded-xl border overflow-hidden",
                isActive ? "border-brand-200 shadow-sm" : "border-slate-200 opacity-90"
              )}>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 text-[14.5px] text-slate-700">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                        isActive ? "bg-brand-50 text-brand-500" : "bg-slate-100 text-slate-400"
                      )}>
                        <Clock size={20} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{monitoring.surgery_type}</p>
                        <p className="text-[12.5px] text-slate-500">
                          Operado el: {new Date(monitoring.surgery_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Badge de Estado */}
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold border",
                      isActive 
                        ? "bg-amber-50 text-amber-600 border-amber-200"
                        : "bg-slate-50 text-slate-500 border-slate-200"
                    )}>
                      {isActive ? (
                        <>En recuperación</>
                      ) : (
                        <><CheckCircle2 size={14} /> Dado de alta</>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-5 pt-5 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                    
                    {/* Botón Principal: Solo si está ACTIVO */}
                    {isActive && (
                      <button 
                        onClick={() => navigate(`/report/${monitoring.id}`)}
                        className="flex-1 flex items-center justify-center gap-2 bg-brand-400 text-white py-2.5 px-4 rounded-lg text-[13.5px] font-semibold hover:bg-brand-500 hover:shadow-md transition-all"
                      >
                        <FilePlus2 size={18} />
                        Enviar Reporte
                      </button>
                    )}

                    {/* Botón Secundario: Ver Historial (Para TODOS) */}
                    <button 
                      onClick={() => navigate(`/history/${monitoring.id}`)}
                      className={cn(
                        "flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-[13.5px] font-semibold transition-all border",
                        isActive 
                          ? "flex-1 border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          : "w-full border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      <History size={18} />
                      Ver Historial de Reportes
                    </button>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};