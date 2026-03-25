import { useNavigate } from 'react-router-dom';
import { Clock, FilePlus2, History, CheckCircle2 } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { SurgicalMonitoring } from '@/features/patients/types/patient.model';

interface MonitoringCardProps {
  monitoring: SurgicalMonitoring;
}

export const MonitoringCard = ({ monitoring }: MonitoringCardProps) => {
  const navigate = useNavigate();
  const isActive = monitoring.status === 'ACTIVE';

  return (
    <div className={cn(
      "bg-white rounded-xl border overflow-hidden transition-all duration-200",
      isActive ? "border-brand-200 shadow-sm" : "border-slate-200 opacity-95 hover:opacity-100"
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
              <p className="font-bold text-slate-800">{monitoring.surgery_type}</p>
              <p className="text-[12.5px] text-slate-500 mt-0.5">
                Operado el: {new Date(monitoring.surgery_date).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Badge de Estado */}
          <div className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border tracking-wide uppercase",
            isActive 
              ? "bg-amber-400/90 text-amber-950 border-amber-400"
              : "bg-slate-100 text-slate-500 border-slate-200"
          )}>
            {isActive ? (
              <>En recuperación</>
            ) : (
              <><CheckCircle2 size={13} /> Dado de alta</>
            )}
          </div>
        </div>
        
        <div className="mt-5 pt-5 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
          {/* Botón Principal: Solo si está ACTIVO */}
          {isActive && (
            <button 
              onClick={() => navigate(`/report/${monitoring.id}`)}
              className="flex-1 flex items-center justify-center gap-2 bg-brand-400 text-white py-2.5 px-4 rounded-lg text-[13.5px] font-semibold hover:bg-brand-500 hover:shadow-[0_2px_10px_rgba(42,170,138,0.38)] hover:-translate-y-[1px] transition-all"
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
                ? "flex-1 border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-800"
                : "w-full border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
            )}
          >
            <History size={18} />
            Ver Historial de Reportes
          </button>
        </div>
      </div>
    </div>
  );
};