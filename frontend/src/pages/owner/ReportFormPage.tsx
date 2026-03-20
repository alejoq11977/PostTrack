import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, ChevronRight, Info, UploadCloud, X, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { patientsService } from '@/features/patients/api/patients.service';
import { MonitoringForm } from '@/features/patients/types/patient.model';
import { cn } from '@/shared/utils/cn';

export const ReportFormPage = () => {
  const { monitoringId } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<MonitoringForm | null>(null);
  const[isLoading, setIsLoading] = useState(true);
  
  // Estados del Formulario
  const[step, setStep] = useState(1);
  const [generalAnswers, setGeneralAnswers] = useState<Record<number, 'yes' | 'no'>>({});
  const [customAnswers, setCustomAnswers] = useState<Record<number, string>>({});
  const [medicalNotes, setMedicalNotes] = useState('');
  const[images, setImages] = useState<(File | null)[]>([null, null, null, null]);
  
  // UI States
  const [expandedInfo, setExpandedInfo] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const data = await patientsService.getMonitoringForm(Number(monitoringId));
        setFormData(data);
      } catch (error) {
        console.error("Error cargando formulario:", error);
        navigate('/'); 
      } finally {
        setIsLoading(false);
      }
    };
    fetchForm();
  }, [monitoringId, navigate]);

  const handleImageUpload = (index: number, file: File) => {
    const newImages = [...images];
    newImages[index] = file;
    setImages(newImages);
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages[index] = null;
    setImages(newImages);
  };

  // === VALIDACIONES DE PASOS ===
  
  // Paso 1: Todas las preguntas generales (Sí/No) deben estar respondidas
  const isStep1Complete = formData?.general_questions.every(q => generalAnswers[q.id]) ?? false;

  // Paso 2: Todas las preguntas personalizadas del veterinario deben tener texto (mínimo 1 caracter válido)
  const isStep2Complete = formData?.monitoring.custom_questions.every(
    cq => customAnswers[cq.id] && customAnswers[cq.id].trim() !== ''
  ) ?? true; // Si no hay preguntas custom, es true por defecto.

  // =============================

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      await patientsService.submitReport({
        monitoringId: Number(monitoringId),
        generalAnswers,
        customAnswers,
        medicalNotes,
        images,
      });

      setIsSuccess(true);
      setStep(4);
      
    } catch (error) {
      console.error("Error al enviar el reporte:", error);
      alert("Ocurrió un error al enviar el reporte. Por favor, revise su conexión e intente nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !formData) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin"></div>
    </div>
  );

  const { monitoring, general_questions } = formData;

  if (isSuccess) return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center animate-in zoom-in-95 duration-500">
      <div className="w-20 h-20 rounded-full bg-brand-50 border-2 border-brand-100 flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 size={40} className="text-brand-500" />
      </div>
      <h2 className="font-display text-3xl text-slate-800 mb-3">Reporte enviado con éxito</h2>
      <p className="text-slate-500 mb-8 max-w-md mx-auto leading-relaxed">
        El equipo veterinario ha recibido su reporte de la cirugía de <strong>{monitoring.surgery_type}</strong>. Será revisado a la brevedad.
      </p>
      <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-brand-400 text-white font-semibold rounded-lg hover:bg-brand-500 transition-colors">
        Volver a mis mascotas
      </button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* HEADER */}
      <div className="mb-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[13.5px] font-medium text-slate-500 hover:text-brand-600 mb-6 transition-colors">
          <ArrowLeft size={16} /> Volver
        </button>
        <p className="text-[11px] font-semibold tracking-[0.09em] uppercase text-brand-400 mb-1.5">Seguimiento Postoperatorio</p>
        <h1 className="font-display text-[28px] text-slate-800 mb-2 leading-tight">Reporte de evolución</h1>
        <p className="text-slate-500 text-[14px] leading-relaxed">
          Cirugía: {monitoring.surgery_type} ({new Date(monitoring.surgery_date).toLocaleDateString()})
        </p>
      </div>

      {/* STEPPER */}
      <div className="flex items-center mb-8">
        {[1, 2, 3].map((num) => (
          <div key={num} className={cn("flex items-center relative", num !== 3 && "flex-1")}>
            <div className={cn(
              "w-8 h-8 rounded-full border-2 flex items-center justify-center text-[12px] font-bold shrink-0 z-10 transition-colors",
              step > num ? "bg-brand-100 border-brand-400 text-brand-600" :
              step === num ? "bg-brand-400 border-brand-400 text-white shadow-[0_0_0_4px_rgba(42,170,138,0.15)]" :
              "bg-white border-slate-200 text-slate-400"
            )}>
              {step > num ? <Check size={14} strokeWidth={3} /> : num}
            </div>
            {num !== 3 && (
              <div className={cn(
                "h-[2px] w-full mx-2 transition-colors",
                step > num ? "bg-brand-200" : "bg-slate-200"
              )}></div>
            )}
          </div>
        ))}
      </div>

      {/* CONTENIDO DE LAS SECCIONES */}
      <div className="bg-white rounded-[22px] shadow-[0_1px_3px_rgba(0,0,0,0.06),_0_4px_16px_rgba(0,0,0,0.07)] overflow-hidden">
        
        {/* SECCIÓN 1: PREGUNTAS SÍ/NO */}
        {step === 1 && (
          <div className="animate-in slide-in-from-right-8 duration-300">
            <div className="bg-slate-50 px-7 py-5 border-b border-slate-100">
              <p className="text-[10.5px] font-bold tracking-widest uppercase text-brand-400 mb-1">Sección 1 de 3</p>
              <h2 className="text-[15px] font-semibold text-slate-800">Preguntas generales de seguimiento</h2>
            </div>
            <div className="p-7">
              <div className="flex items-start gap-2 bg-brand-50 border border-brand-100 rounded-lg p-3 text-[13px] text-brand-700 mb-6">
                <Info size={16} className="shrink-0 mt-0.5" />
                <p>Responda <strong>Sí</strong> o <strong>No</strong> a cada pregunta para continuar.</p>
              </div>

              <div className="divide-y divide-slate-100">
                {general_questions.map((q, idx) => (
                  <div key={q.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 transition-colors",
                        generalAnswers[q.id] ? "bg-brand-100 text-brand-600" : "bg-slate-100 text-slate-400"
                      )}>
                        {generalAnswers[q.id] ? <Check size={12} strokeWidth={3} /> : String(idx + 1).padStart(2, '0')}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <span className="text-[14px] text-slate-600 leading-relaxed">
                            {q.text} <span className="text-red-500">*</span>
                          </span>
                          {q.instruction_text && (
                            <button 
                              onClick={() => setExpandedInfo(expandedInfo === q.id ? null : q.id)}
                              className="text-slate-300 hover:text-brand-500 transition-colors mt-0.5 shrink-0"
                            >
                              <Info size={18} />
                            </button>
                          )}
                        </div>
                        
                        {q.instruction_text && expandedInfo === q.id && (
                          <div className="mt-2.5 bg-slate-50/80 border border-slate-100 rounded-lg p-3 text-[12.5px] text-slate-500 animate-in slide-in-from-top-2 duration-200">
                            {q.instruction_text}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-1.5 shrink-0">
                        <button 
                          onClick={() => setGeneralAnswers(prev => ({ ...prev, [q.id]: 'yes' }))}
                          className={cn("h-8 px-4 rounded-full border text-[12px] font-semibold transition-all",
                            generalAnswers[q.id] === 'yes' ? "bg-brand-50 border-brand-400 text-brand-600" : "bg-white border-slate-200 text-slate-400 hover:border-brand-200 hover:text-brand-500"
                          )}
                        >Sí</button>
                        <button 
                          onClick={() => setGeneralAnswers(prev => ({ ...prev, [q.id]: 'no' }))}
                          className={cn("h-8 px-4 rounded-full border text-[12px] font-semibold transition-all",
                            generalAnswers[q.id] === 'no' ? "bg-red-50 border-red-400 text-red-600" : "bg-white border-slate-200 text-slate-400 hover:border-red-200 hover:text-red-500"
                          )}
                        >No</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-slate-50 px-7 py-5 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setStep(2)} disabled={!isStep1Complete}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand-400 text-white text-[13.5px] font-semibold rounded-full hover:bg-brand-500 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-sm disabled:shadow-none"
              >
                Siguiente <ChevronRight size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}

        {/* SECCIÓN 2: EVALUACIÓN CLÍNICA (Personalizadas + Observaciones) */}
        {step === 2 && (
          <div className="animate-in slide-in-from-right-8 duration-300">
             <div className="bg-slate-50 px-7 py-5 border-b border-slate-100">
              <p className="text-[10.5px] font-bold tracking-widest uppercase text-brand-400 mb-1">Sección 2 de 3</p>
              <h2 className="text-[15px] font-semibold text-slate-800">Evaluación clínica detallada</h2>
            </div>
            <div className="p-7 space-y-6">
              
              <div className="flex items-start gap-2 bg-brand-50 border border-brand-100 rounded-lg p-3 text-[13px] text-brand-700 mb-2">
                <Info size={16} className="shrink-0 mt-0.5" />
                <p>Por favor, responda a las preguntas indicadas con un asterisco (<span className="text-red-500 font-bold">*</span>) formuladas por su médico veterinario.</p>
              </div>

              {/* Preguntas Personalizadas del Veterinario (OBLIGATORIAS) */}
              {monitoring.custom_questions.map((cq) => (
                <div key={cq.id} className="space-y-1.5">
                  <label className="block text-[13.5px] font-semibold text-slate-800 flex justify-between items-center">
                    <span>{cq.text} <span className="text-red-500">*</span></span>
                    {cq.instruction_text && (
                      <span className="text-[11px] font-normal text-brand-600 bg-brand-50 border border-brand-100 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                        <Info size={12} /> {cq.instruction_text}
                      </span>
                    )}
                  </label>
                  <textarea 
                    value={customAnswers[cq.id] || ''}
                    onChange={(e) => setCustomAnswers(prev => ({ ...prev, [cq.id]: e.target.value }))}
                    className="w-full min-h-[90px] p-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-400 focus:ring-[3px] focus:ring-brand-400/15 transition-all resize-y"
                    placeholder="Describa detalladamente..."
                  ></textarea>
                </div>
              ))}

              {/* Observaciones Fijas (medical_notes) - OPCIONAL */}
              <div className="space-y-1.5 pt-4 border-t border-slate-100">
                <label className="block text-[13.5px] font-semibold text-slate-800">
                  Observaciones adicionales del propietario <span className="text-slate-400 font-normal ml-1">(Opcional)</span>
                </label>
                <p className="text-[12px] text-slate-400 mb-2">Cualquier otra situación que considere importante para el médico tratante.</p>
                <textarea 
                  value={medicalNotes}
                  onChange={(e) => setMedicalNotes(e.target.value)}
                  className="w-full min-h-[100px] p-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-400 focus:ring-[3px] focus:ring-brand-400/15 transition-all resize-y"
                  placeholder="Ej. Ayer en la noche se rascó cerca de la herida..."
                ></textarea>
              </div>

            </div>

            <div className="bg-slate-50 px-7 py-5 border-t border-slate-100 flex justify-between">
              <button onClick={() => setStep(1)} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-[13.5px] font-medium rounded-full hover:border-slate-400 transition-all">
                <ArrowLeft size={16} /> Atrás
              </button>
              
              {/* BOTÓN BLOQUEADO SI isStep2Complete ES FALSE */}
              <button 
                onClick={() => setStep(3)} 
                disabled={!isStep2Complete}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand-400 text-white text-[13.5px] font-semibold rounded-full hover:bg-brand-500 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-sm disabled:shadow-none"
              >
                Siguiente <ChevronRight size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}

        {/* SECCIÓN 3: FOTOS */}
        {step === 3 && (
          <div className="animate-in slide-in-from-right-8 duration-300">
            <div className="bg-slate-50 px-7 py-5 border-b border-slate-100">
              <p className="text-[10.5px] font-bold tracking-widest uppercase text-brand-400 mb-1">Sección 3 de 3</p>
              <h2 className="text-[15px] font-semibold text-slate-800">Evidencia fotográfica (Opcional)</h2>
            </div>
            
            <div className="p-7">
              <p className="text-[13px] text-slate-500 leading-relaxed mb-6">
                Adjunte hasta <strong>4 fotografías</strong> que muestren el estado actual de la zona operada. Las imágenes serán revisadas por el veterinario junto con sus respuestas.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {[0, 1, 2, 3].map((index) => (
                  <div key={index} className="relative h-36 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:border-brand-400 hover:bg-brand-50 transition-colors flex flex-col items-center justify-center overflow-hidden group">
                    {images[index] ? (
                      <>
                        <img src={URL.createObjectURL(images[index]!)} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                        <button 
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-red-500 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"
                        >
                          <X size={14} strokeWidth={3} />
                        </button>
                      </>
                    ) : (
                      <>
                        <UploadCloud size={28} className="text-slate-300 group-hover:text-brand-400 mb-2 transition-colors" strokeWidth={1.5} />
                        <span className="text-[12px] font-medium text-slate-400 group-hover:text-brand-500">Imagen {index + 1}</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => e.target.files?.[0] && handleImageUpload(index, e.target.files[0])}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-4 text-center">Formatos aceptados: JPG, PNG. Tamaño máximo recomendado: 5MB</p>
            </div>

            <div className="bg-slate-50 px-7 py-5 border-t border-slate-100 flex justify-between">
              <button onClick={() => setStep(2)} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-[13.5px] font-medium rounded-full hover:border-slate-400 transition-all">
                <ArrowLeft size={16} /> Atrás
              </button>
              <button 
                onClick={handleSubmit} disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand-400 text-white text-[13.5px] font-semibold rounded-full hover:bg-brand-500 disabled:bg-brand-300 transition-all shadow-sm"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/35 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>Enviar Reporte <Check size={16} strokeWidth={2.5} /></>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};