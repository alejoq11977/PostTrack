import { useParams } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import { usePetHistory } from '@/features/monitoring/hooks/usePetHistory';
import { HistoryTimelineCard } from '@/features/monitoring/components/HistoryTimelineCard';

export const PetHistoryPage = () => {
  const { monitoringId } = useParams();
  const { reports, isLoading, expandedId, toggleExpand, navigate } = usePetHistory(monitoringId);

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500 pb-10">
      {/* HEADER */}
      <div className="mb-8">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-[13.5px] font-medium text-slate-500 hover:text-brand-600 mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Volver
        </button>
        <p className="text-[11px] font-semibold tracking-[0.09em] uppercase text-brand-400 mb-1.5">Registro Clínico</p>
        <h1 className="font-display text-[28px] font-semibold text-slate-800 mb-2 tracking-tight">Historial de Reportes</h1>
        <p className="text-slate-500 text-[14px]">Evolución enviada para este seguimiento postoperatorio.</p>
      </div>

      {/* LISTA O ESTADO VACÍO */}
      {reports.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center mt-10 shadow-sm">
          <Calendar size={40} className="text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-1">Sin reportes</h3>
          <p className="text-slate-500 text-[14px]">Aún no ha enviado ningún reporte de salud para esta cirugía.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <HistoryTimelineCard 
              key={report.id} 
              report={report} 
              isExpanded={expandedId === report.id}
              onToggle={() => toggleExpand(report.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};