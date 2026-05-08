import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export const VetDashboardPage = () => {
  useEffect(() => {
    document.title = 'Dashboard - PostTrack';
  }, []);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-[24px] font-display font-semibold text-slate-800 tracking-tight">
          Dashboard
        </h1>
        <p className="text-slate-400 text-[13px] mt-1">
          Alertas y overview de la clínica
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <AlertTriangle size={48} className="text-amber-400 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-slate-700 mb-2">Dashboard en desarrollo</h2>
        <p className="text-slate-500 text-sm">
          Las alertas en tiempo real y gráficos se implementarán proximamente.
        </p>
      </div>
    </div>
  );
};