import { FileText } from 'lucide-react';

export const VetReportsPage = () => {
  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-[24px] font-display font-semibold text-slate-800 tracking-tight">
          Reportes
        </h1>
        <p className="text-slate-400 text-[13px] mt-1">
          Revisa y valida los reportes de seguimiento
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <FileText size={48} className="text-slate-300 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-slate-700 mb-2">Reportes en desarrollo</h2>
        <p className="text-slate-500 text-sm">
          Lista de reportes, filtros y validación se implementarán proximamente.
        </p>
      </div>
    </div>
  );
};