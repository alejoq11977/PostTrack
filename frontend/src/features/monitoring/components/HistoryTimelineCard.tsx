import { Calendar, CheckCircle2, Clock, AlertCircle, ImageIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { ReportHistory } from '@/features/patients/types/patient.model';

interface HistoryTimelineCardProps {
  report: ReportHistory;
  isExpanded: boolean;
  onToggle: () => void;
}

export const HistoryTimelineCard = ({ report, isExpanded, onToggle }: HistoryTimelineCardProps) => {
  const date = new Date(report.submitted_at);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden transition-all hover:border-brand-200">
      {/* CABECERA (Clickeable) */}
      <div 
        onClick={onToggle}
        className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer bg-slate-50 hover:bg-brand-50/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 shrink-0 shadow-sm">
            <Calendar size={18} />
          </div>
          <div>
            <p className="font-bold text-slate-800 capitalize">
              {date.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-[12.5px] text-slate-500 mt-0.5">
              Enviado a las {date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 border-slate-200 pt-3 sm:pt-0">
          {/* Status de Revisión */}
          {report.review_status === 'REVIEWED' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-50 text-green-600 text-[11px] font-bold border border-green-200 uppercase tracking-wide">
              <CheckCircle2 size={14} /> Revisado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-500 text-[11px] font-bold border border-slate-200 uppercase tracking-wide">
              <Clock size={14} /> Pendiente
            </span>
          )}
          <div className="text-slate-400">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>
      </div>

      {/* CONTENIDO EXPANDIBLE */}
      {isExpanded && (
        <div className="p-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
          
          {/* Respuestas del Cuestionario */}
          <div className="mb-6">
            <h4 className="text-[11.5px] font-bold uppercase tracking-wider text-slate-400 mb-4">Respuestas del cuestionario</h4>
            <ul className="space-y-4">
              {report.answers.map((ans) => (
                <li key={ans.id} className="flex items-start gap-3.5 text-[13.5px]">
                  <div className="mt-0.5 shrink-0">
                    {ans.value === 'yes' ? (
                      <span className="inline-flex justify-center w-8 py-0.5 bg-brand-50 text-brand-600 font-bold text-[10px] rounded border border-brand-200">SÍ</span>
                    ) : ans.value === 'no' ? (
                      <span className="inline-flex justify-center w-8 py-0.5 bg-red-50 text-red-600 font-bold text-[10px] rounded border border-red-200">NO</span>
                    ) : (
                      <span className="inline-block w-2 h-2 rounded-full bg-slate-300 mt-1.5 ml-3"></span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-700 font-medium mb-1">{ans.question_text}</p>
                    {ans.value !== 'yes' && ans.value !== 'no' && (
                      <p className="text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 text-[13px] leading-relaxed">
                        {ans.value}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Notas Médicas (Opcional) */}
          {report.medical_notes && (
            <div className="mb-6">
              <h4 className="text-[11.5px] font-bold uppercase tracking-wider text-slate-400 mb-2">Observaciones adicionales</h4>
              <p className="text-[13.5px] text-slate-600 bg-amber-50/50 p-3.5 rounded-lg border border-amber-100/50 italic leading-relaxed">
                "{report.medical_notes}"
              </p>
            </div>
          )}

          {/* Evidencias Visuales y Estado de Celery */}
          <div>
            <h4 className="text-[11.5px] font-bold uppercase tracking-wider text-slate-400 mb-3">Evidencia fotográfica</h4>
            
            {report.processing_status === 'PROCESSING' && (
              <div className="flex items-center gap-3 text-[13px] text-brand-600 bg-brand-50 p-4 rounded-lg border border-brand-100 font-medium">
                <div className="w-4 h-4 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin shrink-0"></div>
                Sus imágenes se están procesando de forma segura en nuestros servidores. Aparecerán aquí en unos instantes.
              </div>
            )}

            {report.processing_status === 'FAILED' && (
              <div className="flex items-center gap-3 text-[13px] text-red-600 bg-red-50 p-4 rounded-lg border border-red-100 font-medium">
                <AlertCircle size={18} className="shrink-0" />
                Ocurrió un error al procesar sus imágenes. Por favor, contacte a soporte si el problema persiste.
              </div>
            )}

            {report.processing_status === 'COMPLETED' && report.evidences.length === 0 && (
              <div className="flex items-center gap-2 text-[13px] text-slate-500 p-2">
                <ImageIcon size={16} /> No se adjuntaron fotografías en este reporte.
              </div>
            )}

            {report.processing_status === 'COMPLETED' && report.evidences.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {report.evidences.map((img) => (
                  <a 
                    key={img.id} 
                    href={img.image_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block aspect-square rounded-lg border border-slate-200 overflow-hidden hover:border-brand-400 transition-colors"
                  >
                    <img src={img.image_url} alt="Evidencia" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  </a>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};