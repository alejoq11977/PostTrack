import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, CheckCircle2, Clock, AlertCircle, ImageIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { patientsService } from '@/features/patients/api/patients.service';
import { ReportHistory } from '@/features/patients/types/patient.model';
import { cn } from '@/shared/utils/cn';

export const PetHistoryPage = () => {
  const { monitoringId } = useParams();
  const navigate = useNavigate();
  
  const [reports, setReports] = useState<ReportHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const[expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await patientsService.getMonitoringHistory(Number(monitoringId));
        setReports(data);
        // Expandir el reporte más reciente por defecto si existe
        if (data.length > 0) setExpandedId(data[0].id);
      } catch (error) {
        console.error("Error cargando historial:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [monitoringId]);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500 pb-10">
      
      {/* HEADER */}
      <div className="mb-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[13.5px] font-medium text-slate-500 hover:text-brand-600 mb-6 transition-colors">
          <ArrowLeft size={16} /> Volver
        </button>
        <p className="text-[11px] font-semibold tracking-[0.09em] uppercase text-brand-400 mb-1.5">Registro Clínico</p>
        <h1 className="font-display text-[28px] text-slate-800 mb-2 leading-tight">Historial de Reportes</h1>
        <p className="text-slate-500 text-[14px]">Evolución enviada para este seguimiento postoperatorio.</p>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
          <Calendar size={40} className="text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-1">Sin reportes</h3>
          <p className="text-slate-500 text-sm">Aún no ha enviado ningún reporte de salud para esta cirugía.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const isExpanded = expandedId === report.id;
            const date = new Date(report.submitted_at);

            return (
              <div key={report.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden transition-all hover:border-brand-200">
                {/* CABECERA DEL REPORTE (Clickeable) */}
                <div 
                  onClick={() => toggleExpand(report.id)}
                  className="p-5 flex items-center justify-between cursor-pointer bg-slate-50 hover:bg-brand-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 shrink-0 shadow-sm">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">
                        {date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                      <p className="text-[12.5px] text-slate-500 mt-0.5">
                        Enviado a las {date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {/* Status de Revisión del Médico */}
                    {report.review_status === 'REVIEWED' ? (
                      <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-50 text-green-600 text-[11px] font-bold border border-green-200">
                        <CheckCircle2 size={14} /> Revisado por el veterinario
                      </span>
                    ) : (
                      <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-500 text-[11px] font-bold border border-slate-200">
                        <Clock size={14} /> Pendiente de revisión
                      </span>
                    )}
                    <div className="text-slate-400">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                </div>

                {/* CONTENIDO EXPANDIBLE DEL REPORTE */}
                {isExpanded && (
                  <div className="p-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                    
                    {/* Respuestas */}
                    <div className="mb-6">
                      <h4 className="text-[11.5px] font-bold uppercase tracking-wider text-slate-400 mb-3">Respuestas del cuestionario</h4>
                      <ul className="space-y-3">
                        {report.answers.map((ans) => (
                          <li key={ans.id} className="flex items-start gap-3 text-[13.5px]">
                            <div className="mt-0.5 shrink-0">
                              {ans.value === 'yes' ? (
                                <span className="inline-block px-2 py-0.5 bg-brand-50 text-brand-600 font-bold text-[10px] rounded border border-brand-200">SÍ</span>
                              ) : ans.value === 'no' ? (
                                <span className="inline-block px-2 py-0.5 bg-red-50 text-red-600 font-bold text-[10px] rounded border border-red-200">NO</span>
                              ) : (
                                <span className="inline-block w-2 h-2 rounded-full bg-slate-300 mt-1.5"></span>
                              )}
                            </div>
                            <div>
                              <p className="text-slate-700 font-medium mb-0.5">{ans.question_text}</p>
                              {ans.value !== 'yes' && ans.value !== 'no' && (
                                <p className="text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">{ans.value}</p>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Notas Médicas (Si hay) */}
                    {report.medical_notes && (
                      <div className="mb-6">
                        <h4 className="text-[11.5px] font-bold uppercase tracking-wider text-slate-400 mb-2">Observaciones adicionales</h4>
                        <p className="text-[13.5px] text-slate-600 bg-amber-50/50 p-3 rounded-lg border border-amber-100/50 italic">
                          "{report.medical_notes}"
                        </p>
                      </div>
                    )}

                    {/* Evidencias Visuales y Estado de Celery */}
                    <div>
                      <h4 className="text-[11.5px] font-bold uppercase tracking-wider text-slate-400 mb-3">Evidencia fotográfica</h4>
                      
                      {report.processing_status === 'PROCESSING' && (
                        <div className="flex items-center gap-3 text-[13px] text-brand-600 bg-brand-50 p-3 rounded-lg border border-brand-100">
                          <div className="w-4 h-4 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin shrink-0"></div>
                          Sus imágenes se están procesando de forma segura en nuestros servidores. Aparecerán aquí en unos instantes.
                        </div>
                      )}

                      {report.processing_status === 'FAILED' && (
                        <div className="flex items-center gap-3 text-[13px] text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                          <AlertCircle size={18} className="shrink-0" />
                          Ocurrió un error al procesar sus imágenes. Por favor, contacte a soporte si el problema persiste.
                        </div>
                      )}

                      {report.processing_status === 'COMPLETED' && report.evidences.length === 0 && (
                        <div className="flex items-center gap-2 text-[13px] text-slate-500">
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
          })}
        </div>
      )}
    </div>
  );
};