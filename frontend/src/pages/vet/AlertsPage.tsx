import { Building2, AlertTriangle } from 'lucide-react';

export const AlertsPage = () => {
  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-[24px] font-display font-semibold text-slate-800 tracking-tight">
          Alertas de Monitoreo
        </h1>
        <p className="text-slate-400 text-[13px] mt-1">
          Pacientes que requieren atención post-operatoria
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
            <AlertTriangle size={24} className="text-amber-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            No hay alertas pendientes
          </h3>
          <p className="text-slate-500 text-sm max-w-sm">
            Los pacientes que requieren atención post-operatoria aparecerán aquí.
          </p>
        </div>
      </div>
    </div>
  );
};