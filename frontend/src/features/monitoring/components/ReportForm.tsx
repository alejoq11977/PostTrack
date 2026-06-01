import { memo, useEffect, useState } from 'react';
import { ArrowLeft, Check, ChevronRight, Info, UploadCloud, X, CheckCircle2, HeartPulse, MessageSquare, Camera } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { useReportForm } from '../hooks/useReportForm';
import { ReportStepper } from './ReportStepper';

interface ReportFormProps {
  monitoringId: string;
}

interface QuestionRowProps {
  question: { id: number; text: string; instruction_text?: string | null };
  index: number;
  answer: 'yes' | 'no' | undefined;
  expanded: boolean;
  onAnswer: (id: number, value: 'yes' | 'no') => void;
  onToggleInfo: (id: number) => void;
}

// Fila memoizada: al responder o desplegar info solo se re-renderiza la fila
// afectada, no las 21 preguntas. Evita el jank al responder Sí/No.
const QuestionRow = memo(({ question, index, answer, expanded, onAnswer, onToggleInfo }: QuestionRowProps) => (
  <div className="py-4 first:pt-0 last:pb-0">
    <div className="flex items-start gap-3 sm:gap-4">
      <div className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 transition-colors",
        answer ? "bg-brand-100 text-brand-600" : "bg-slate-100 text-slate-400"
      )}>
        {answer ? <Check size={12} strokeWidth={3} /> : String(index + 1).padStart(2, '0')}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[14px] text-slate-600 leading-relaxed">
          {question.text} <span className="text-red-500">*</span>
        </p>

        {question.instruction_text && (
          <button
            type="button"
            onClick={() => onToggleInfo(question.id)}
            className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium text-brand-500 hover:text-brand-600 transition-colors"
          >
            <Info size={13} className="shrink-0" />
            {expanded ? 'Ocultar indicación' : '¿Cómo lo reviso?'}
          </button>
        )}

        {question.instruction_text && expanded && (
          <div className="mt-2 bg-brand-50/70 border border-brand-100 rounded-lg p-3 text-[12.5px] text-brand-800 leading-relaxed animate-in slide-in-from-top-2 duration-200">
            {question.instruction_text}
          </div>
        )}
      </div>

      <div className="flex gap-1.5 shrink-0">
        <button
          onClick={() => onAnswer(question.id, 'yes')}
          className={cn("h-8 px-4 rounded-full border text-[12px] font-semibold transition-colors",
            answer === 'yes' ? "bg-brand-50 border-brand-400 text-brand-600" : "bg-white border-slate-200 text-slate-400 hover:border-brand-200 hover:text-brand-500"
          )}
        >Sí</button>
        <button
          onClick={() => onAnswer(question.id, 'no')}
          className={cn("h-8 px-4 rounded-full border text-[12px] font-semibold transition-colors",
            answer === 'no' ? "bg-red-50 border-red-400 text-red-600" : "bg-white border-slate-200 text-slate-400 hover:border-red-200 hover:text-red-500"
          )}
        >No</button>
      </div>
    </div>
  </div>
));
QuestionRow.displayName = 'QuestionRow';

// Miniatura de imagen: crea el object URL DENTRO del efecto y lo guarda en estado,
// liberándolo en la limpieza. Es la forma correcta bajo StrictMode (que monta el
// efecto, lo limpia y lo vuelve a montar): así siempre queda una URL vigente.
const ImagePreview = ({ file, onRemove }: { file: File; onRemove: () => void }) => {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  return (
    <>
      {url && <img src={url} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />}
      <button onClick={onRemove} className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-red-500 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors z-10">
        <X size={14} strokeWidth={3} />
      </button>
    </>
  );
};

export const ReportForm = ({ monitoringId }: ReportFormProps) => {
  const {
    formData, isLoading, step, setStep,
    generalAnswers, setGeneralAnswer,
    customAnswers, setCustomAnswer,
    medicalNotes, setMedicalNotes,
    images, handleImageUpload, removeImage,
    expandedInfo, toggleExpandedInfo,
    isSubmitting, isSuccess,
    isStep1Complete, isStep2Complete,
    handleSubmit, navigate
  } = useReportForm(monitoringId);

  if (isLoading || !formData) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin"></div>
    </div>
  );

  const { monitoring, general_questions } = formData;

  const petName = monitoring.patient_name?.trim() || 'tu mascota';
  const petEmoji = monitoring.patient_species === 'Felino' ? '🐈'
    : monitoring.patient_species === 'Canino' ? '🐕' : '🐾';
  const daysSince = monitoring.surgery_date
    ? Math.max(0, Math.floor((Date.now() - new Date(monitoring.surgery_date).getTime()) / 86400000))
    : null;

  if (isSuccess) return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-[0_1px_3px_rgba(0,0,0,0.06),_0_8px_30px_rgba(42,170,138,0.10)] border border-brand-100 p-12 text-center animate-in zoom-in-95 duration-500">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-400 to-brand-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-brand-500/25">
        <CheckCircle2 size={40} className="text-white" />
      </div>
      <h2 className="font-display text-3xl text-slate-800 mb-3">¡Gracias por cuidar a {petName}! 💚</h2>
      <p className="text-slate-500 mb-8 max-w-md mx-auto leading-relaxed">
        Tu veterinario ya recibió el reporte de hoy. Si algo necesita atención, se pondrá en contacto contigo.
      </p>
      <button onClick={() => navigate('/')} className="px-6 py-3 bg-brand-500 text-white font-semibold rounded-xl hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/20">
        Volver a mis mascotas
      </button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">

      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[13.5px] font-medium text-slate-500 hover:text-brand-600 mb-5 transition-colors">
        <ArrowLeft size={16} /> Volver
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6 lg:gap-8 items-start">

        {/* RIEL IZQUIERDO: hero + stepper (sticky en escritorio) */}
        <aside className="lg:sticky lg:top-4 space-y-5">
          <div className="rounded-3xl bg-gradient-to-br from-brand-50 via-white to-brand-50/40 border border-brand-100 p-5 lg:p-6 flex flex-row items-center gap-4 lg:flex-col lg:items-start lg:gap-0">
            {monitoring.patient_photo ? (
              <img
                src={monitoring.patient_photo}
                alt={petName}
                className="w-16 h-16 rounded-2xl object-cover shadow-md shrink-0 lg:w-full lg:h-auto lg:aspect-square"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-white border border-brand-100 flex items-center justify-center text-3xl shadow-sm shrink-0 lg:w-full lg:h-auto lg:aspect-square lg:text-6xl">
                {petEmoji}
              </div>
            )}
            <div className="min-w-0 lg:mt-4 lg:w-full">
              <p className="text-[11px] font-semibold tracking-[0.09em] uppercase text-brand-500 mb-1">Reporte de seguimiento</p>
              <h1 className="font-display text-[22px] sm:text-[24px] lg:text-[26px] text-slate-800 leading-tight">
                ¿Cómo sigue {petName} hoy?
              </h1>
              <p className="text-slate-500 text-[13px] mt-1 leading-relaxed">
                {monitoring.surgery_type}{daysSince !== null && ` · Día ${daysSince} de recuperación`}
              </p>
            </div>
          </div>

          <ReportStepper currentStep={step} />
        </aside>

        {/* COLUMNA DERECHA: tarjeta del formulario */}
        <div className="min-w-0 bg-white rounded-[22px] shadow-[0_1px_3px_rgba(0,0,0,0.06),_0_4px_16px_rgba(0,0,0,0.07)] overflow-hidden">
        
        {/* === SECCIÓN 1 === */}
        {step === 1 && (
          <div className="animate-in slide-in-from-right-8 duration-300">
            <div className="px-6 sm:px-7 py-5 bg-gradient-to-r from-brand-50 to-transparent border-b border-brand-100/70 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
                <HeartPulse size={20} />
              </div>
              <div>
                <p className="text-[10.5px] font-bold tracking-widest uppercase text-brand-400">Paso 1 de 3</p>
                <h2 className="text-[16px] font-semibold text-slate-800">¿Cómo se ha sentido {petName}?</h2>
              </div>
            </div>
            <div className="p-6 sm:p-7">
              <div className="flex items-start gap-2 bg-brand-50 border border-brand-100 rounded-xl p-3.5 text-[13px] text-brand-700 mb-6">
                <Info size={16} className="shrink-0 mt-0.5" />
                <p>Marca <strong>Sí</strong> o <strong>No</strong> según lo que veas. Si tienes dudas, toca <strong>«¿Cómo lo reviso?»</strong> bajo cada pregunta.</p>
              </div>

              <div className="divide-y divide-slate-100">
                {general_questions.map((q, idx) => (
                  <QuestionRow
                    key={q.id}
                    question={q}
                    index={idx}
                    answer={generalAnswers[q.id]}
                    expanded={expandedInfo === q.id}
                    onAnswer={setGeneralAnswer}
                    onToggleInfo={toggleExpandedInfo}
                  />
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

        {/* === SECCIÓN 2 === */}
        {step === 2 && (
          <div className="animate-in slide-in-from-right-8 duration-300">
            <div className="px-6 sm:px-7 py-5 bg-gradient-to-r from-brand-50 to-transparent border-b border-brand-100/70 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
                <MessageSquare size={20} />
              </div>
              <div>
                <p className="text-[10.5px] font-bold tracking-widest uppercase text-brand-400">Paso 2 de 3</p>
                <h2 className="text-[16px] font-semibold text-slate-800">Lo que pregunta tu veterinario</h2>
              </div>
            </div>
            <div className="p-6 sm:p-7 space-y-6">

              <div className="flex items-start gap-2 bg-brand-50 border border-brand-100 rounded-xl p-3.5 text-[13px] text-brand-700 mb-2">
                <Info size={16} className="shrink-0 mt-0.5" />
                <p>Cuéntale con tus palabras. Las preguntas con <span className="text-red-500 font-bold">*</span> son obligatorias.</p>
              </div>

              {monitoring.custom_questions.map((cq) => (
                <div key={cq.id} className="space-y-2">
                  <label className="block text-[13.5px] font-semibold text-slate-800 leading-relaxed">
                    {cq.text} <span className="text-red-500">*</span>
                  </label>
                  {cq.instruction_text && (
                    <div className="flex items-start gap-2 bg-brand-50/70 border border-brand-100 rounded-lg px-3 py-2 text-[12px] text-brand-800 leading-relaxed">
                      <Info size={13} className="shrink-0 mt-0.5" />
                      <span>{cq.instruction_text}</span>
                    </div>
                  )}
                  <textarea
                    value={customAnswers[cq.id] || ''}
                    onChange={(e) => setCustomAnswer(cq.id, e.target.value)}
                    className="w-full min-h-[90px] p-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-400 focus:ring-[3px] focus:ring-brand-400/15 transition-all resize-y"
                    placeholder="Describa detalladamente..."
                  ></textarea>
                </div>
              ))}

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
              <button 
                onClick={() => setStep(3)} disabled={!isStep2Complete}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand-400 text-white text-[13.5px] font-semibold rounded-full hover:bg-brand-500 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-sm disabled:shadow-none"
              >
                Siguiente <ChevronRight size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}

        {/* === SECCIÓN 3 === */}
        {step === 3 && (
          <div className="animate-in slide-in-from-right-8 duration-300">
            <div className="px-6 sm:px-7 py-5 bg-gradient-to-r from-brand-50 to-transparent border-b border-brand-100/70 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
                <Camera size={20} />
              </div>
              <div>
                <p className="text-[10.5px] font-bold tracking-widest uppercase text-brand-400">Paso 3 de 3</p>
                <h2 className="text-[16px] font-semibold text-slate-800">Una foto ayuda mucho <span className="text-slate-400 font-normal text-[13px]">· opcional</span></h2>
              </div>
            </div>

            <div className="p-6 sm:p-7">
              <p className="text-[13px] text-slate-500 leading-relaxed mb-6">
                Adjunta hasta <strong>4 fotos</strong> de la herida o de {petName}. Le ayudan a tu veterinario a revisar mejor cómo va la recuperación.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {[0, 1, 2, 3].map((index) => (
                  <div key={index} className="relative h-36 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:border-brand-400 hover:bg-brand-50 transition-colors flex flex-col items-center justify-center overflow-hidden group">
                    {images[index] ? (
                      <ImagePreview file={images[index]!} onRemove={() => removeImage(index)} />
                    ) : (
                      <>
                        <UploadCloud size={28} className="text-slate-300 group-hover:text-brand-400 mb-2 transition-colors" strokeWidth={1.5} />
                        <span className="text-[12px] font-medium text-slate-400 group-hover:text-brand-500">Imagen {index + 1}</span>
                        <input 
                          type="file" accept="image/*" 
                          onChange={(e) => e.target.files?.[0] && handleImageUpload(index, e.target.files[0])}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>
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
    </div>
  );
};