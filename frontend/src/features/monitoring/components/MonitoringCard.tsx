import { useNavigate } from 'react-router-dom';
import { Clock, FilePlus2, History, CheckCircle2, Home, AlertTriangle } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { SurgicalMonitoring } from '@/features/patients/types/patient.model';

interface MonitoringCardProps {
  monitoring: SurgicalMonitoring;
}

// "Hace 5 min", "hace 3h", "hace 2d". Para reportes vencidos.
function timeAgo(dateStr: string): string {
  const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diffMin < 1) return 'hace un instante';
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `hace ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  return diffD === 1 ? 'hace 1 día' : `hace ${diffD} días`;
}

// "En 5 min", "en 3h", "mañana a las 9:00 a.m.", o fecha para más adelante.
function timeUntil(dateStr: string): string {
  const date = new Date(dateStr);
  const diffMin = Math.floor((date.getTime() - Date.now()) / 60000);
  if (diffMin < 1) return 'en cualquier momento';
  if (diffMin < 60) return `en ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `en ${diffH} h`;
  const now = new Date();
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const timeStr = date.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' });
  if (sameDay(date, tomorrow)) return `mañana a las ${timeStr}`;
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) + ` a las ${timeStr}`;
}

export const MonitoringCard = ({ monitoring }: MonitoringCardProps) => {
  const navigate = useNavigate();
  const isActive = monitoring.status === 'ACTIVE';
  // El propietario solo puede reportar cuando la mascota ya salió de la clínica a casa.
  const isReleased = !!monitoring.home_release_date && new Date(monitoring.home_release_date) <= new Date();
  const canReport = isActive && isReleased;
  const inClinic = isActive && !isReleased;
  const isOverdue = canReport && !!monitoring.is_overdue;

  return (
    <div className={cn(
      "bg-white rounded-xl border overflow-hidden transition-all duration-200",
      isActive ? "border-brand-200 shadow-sm" : "border-slate-200 opacity-95 hover:opacity-100"
    )}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-4 text-base text-slate-700">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
              isActive ? "bg-brand-50 text-brand-500" : "bg-slate-100 text-slate-400"
            )}>
              <Clock size={22} />
            </div>
            <div>
              <p className="font-bold text-lg text-slate-800">{monitoring.surgery_type}</p>
              <p className="text-sm text-slate-500 mt-0.5">
                Operado el: {new Date(monitoring.surgery_date).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Badge de Estado */}
          <div className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold border tracking-wide uppercase",
            !isActive
              ? "bg-slate-100 text-slate-500 border-slate-200"
              : isOverdue
              ? "bg-red-100 text-red-700 border-red-200"
              : inClinic
              ? "bg-sky-100 text-sky-700 border-sky-200"
              : "bg-amber-400/90 text-amber-950 border-amber-400"
          )}>
            {!isActive ? (
              <><CheckCircle2 size={14} /> Dado de alta</>
            ) : isOverdue ? (
              <><AlertTriangle size={14} /> Reporte pendiente</>
            ) : inClinic ? (
              <><Home size={14} /> En la clínica</>
            ) : (
              <>En recuperación</>
            )}
          </div>
        </div>

        {/* Aviso: aún en la clínica, no se requieren reportes todavía */}
        {inClinic && (
          <div className="mt-4 flex items-start gap-3 rounded-xl bg-sky-50 border border-sky-100 p-4">
            <Home size={18} className="text-sky-500 mt-0.5 shrink-0" />
            <p className="text-sm text-sky-800">
              Tu mascota aún está en la clínica. Cuando reciba el alta para irse a casa, aquí
              podrás comenzar a enviar los reportes de seguimiento.
            </p>
          </div>
        )}

        {/* Estado del próximo reporte (solo cuando ya puede reportar) */}
        {canReport && isOverdue && monitoring.next_report_at && (
          <div className="mt-4 flex items-start gap-3 rounded-xl bg-red-50 border border-red-100 p-4">
            <AlertTriangle size={18} className="text-red-500 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-red-800">Tienes un reporte pendiente por enviar</p>
              <p className="text-red-700/90 mt-0.5">
                Debías enviarlo {timeAgo(monitoring.next_report_at)}. Envíalo cuando puedas para que tu veterinario sepa cómo va la recuperación.
              </p>
            </div>
          </div>
        )}
        {canReport && !isOverdue && monitoring.next_report_at && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-brand-50/70 border border-brand-100 px-4 py-2.5">
            <Clock size={15} className="text-brand-500 shrink-0" />
            <p className="text-sm text-brand-800">
              Próximo reporte <span className="font-medium">{timeUntil(monitoring.next_report_at)}</span>
            </p>
          </div>
        )}

        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
          {/* Botón Principal: solo si está ACTIVO y ya salió de la clínica */}
          {canReport && (
            <button
              onClick={() => navigate(`/report/${monitoring.id}`)}
              className="flex-1 flex items-center justify-center gap-2 bg-brand-400 text-white py-3 px-5 rounded-xl text-sm font-semibold hover:bg-brand-500 hover:shadow-[0_2px_10px_rgba(42,170,138,0.38)] hover:-translate-y-[1px] transition-all"
            >
              <FilePlus2 size={20} />
              Enviar Reporte
            </button>
          )}

          {/* Botón Secundario: Ver Historial (Para TODOS) */}
          <button 
            onClick={() => navigate(`/history/${monitoring.id}`)}
            className={cn(
              "flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-semibold transition-all border",
              canReport
                ? "flex-1 border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-800"
                : "w-full border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
            )}
          >
            <History size={20} />
            Ver Historial de Reportes
          </button>
        </div>
      </div>
    </div>
  );
};