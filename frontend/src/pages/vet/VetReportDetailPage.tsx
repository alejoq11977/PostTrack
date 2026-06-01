import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, AlertTriangle, Phone, Mail, MessageCircle, X, Check, ZoomIn, Image as ImageIcon, ClipboardCheck } from 'lucide-react';
import { vetService, VetReport, VetEvidence, VetAnswer } from '@/features/vet/api/vet.service';

type RiskKey = 'LOW' | 'MEDIUM' | 'HIGH';

const RISK_META: Record<RiskKey, { label: string; chip: string; row: string; icon: string }> = {
  HIGH: { label: 'Alto', chip: 'bg-red-100 text-red-700', row: 'bg-red-50 border-red-100', icon: 'text-red-500' },
  MEDIUM: { label: 'Medio', chip: 'bg-amber-100 text-amber-700', row: 'bg-amber-50 border-amber-100', icon: 'text-amber-500' },
  LOW: { label: 'Bajo', chip: 'bg-emerald-100 text-emerald-700', row: 'bg-white border-slate-100', icon: 'text-emerald-500' },
};

function riskLabel(risk?: string | null): string {
  if (risk === 'HIGH') return 'Alto';
  if (risk === 'MEDIUM') return 'Medio';
  if (risk === 'LOW') return 'Bajo';
  return 'Sin datos';
}

function ImageGalleryItem({ evidence }: { evidence: VetEvidence }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 group hover:ring-2 ring-brand-500 transition-all"
      >
        <img src={evidence.image_url} alt="Evidencia" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-colors">
          <ZoomIn size={22} className="text-white opacity-0 group-hover:opacity-100" />
        </div>
      </button>
      {isOpen && <ImageModal evidence={evidence} onClose={() => setIsOpen(false)} />}
    </>
  );
}

function ImageModal({ evidence, onClose }: { evidence: VetEvidence; onClose: () => void }) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.5, 0.5));
  const handleReset = () => { setScale(1); setPosition({ x: 0, y: 0 }); };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setScale(prev => Math.min(Math.max(prev + delta, 0.5), 4));
  };
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };
  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col" onClick={onClose}>
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
        <span className="text-white text-sm">Evidencia #{evidence.id}</span>
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); handleZoomOut(); }} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors">
            <span className="text-xl font-bold">−</span>
          </button>
          <span className="text-white text-sm w-16 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={(e) => { e.stopPropagation(); handleZoomIn(); }} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors">
            <span className="text-xl font-bold">+</span>
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleReset(); }} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors ml-2">
            <span className="text-xs font-medium">Reset</span>
          </button>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors ml-4">
            <X size={20} />
          </button>
        </div>
      </div>
      <div
        className="flex-1 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          src={evidence.image_url}
          alt="Evidencia"
          className="max-w-full max-h-full object-contain transition-transform duration-150"
          style={{ transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)` }}
          draggable={false}
        />
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs">
        Scroll para hacer zoom · Arrastra para mover · Clic fuera para cerrar
      </div>
    </div>
  );
}

// Fila de una pregunta general: ícono + texto, coloreada por el riesgo clínico real.
function GeneralAnswerRow({ answer }: { answer: VetAnswer }) {
  const risk = answer.present ? (answer.risk_level as RiskKey | undefined) : undefined;
  const meta = risk ? RISK_META[risk] : null;

  return (
    <div className={`flex items-start gap-3 rounded-xl border p-3 ${meta ? meta.row : 'bg-white border-slate-100'}`}>
      <div className="shrink-0 mt-0.5">
        {answer.present ? (
          <AlertTriangle size={18} className={meta ? meta.icon : 'text-slate-400'} />
        ) : (
          <CheckCircle2 size={18} className="text-emerald-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700 leading-snug">{answer.question_text}</p>
      </div>
      {answer.present && risk && (
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${meta!.chip}`}>
          {meta!.label}
        </span>
      )}
    </div>
  );
}

export const VetReportDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<VetReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [validatedRisk, setValidatedRisk] = useState('');
  const [justification, setJustification] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isMarkingReviewed, setIsMarkingReviewed] = useState(false);

  useEffect(() => {
    document.title = 'Detalle Reporte - PostTrack';
  }, []);

  useEffect(() => {
    if (!id) return;
    const fetchReport = async () => {
      try {
        const data = await vetService.getReport(parseInt(id));
        setReport(data);
        if (data.validated_risk) setValidatedRisk(data.validated_risk);
      } catch (err) {
        console.error('Error fetching report:', err);
        navigate('/vet/reports');
      } finally {
        setIsLoading(false);
      }
    };
    fetchReport();
  }, [id, navigate]);

  const handleValidate = async () => {
    if (!id || !validatedRisk) return;
    setIsSaving(true);
    try {
      await vetService.validateReport(parseInt(id), { validated_risk: validatedRisk, justification });
      setReport(prev => prev ? { ...prev, validated_risk: validatedRisk } : null);
    } catch (err) {
      console.error('Error validating report:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkReviewed = async () => {
    if (!id) return;
    setIsMarkingReviewed(true);
    try {
      await vetService.markReportReviewed(parseInt(id));
      setReport(prev => prev ? { ...prev, review_status: 'REVIEWED' } : null);
    } catch (err) {
      console.error('Error marking report as reviewed:', err);
    } finally {
      setIsMarkingReviewed(false);
    }
  };

  if (isLoading || !report) {
    return (
      <div className="animate-pulse p-8">
        <div className="h-8 w-32 bg-slate-200 rounded mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 h-80 bg-slate-200 rounded-2xl" />
          <div className="lg:col-span-5 h-80 bg-slate-200 rounded-2xl" />
          <div className="lg:col-span-4 h-80 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  const calcRisk = (report.calculated_risk || 'LOW') as RiskKey;
  const calcMeta = RISK_META[calcRisk] || RISK_META.LOW;
  const isReviewed = report.review_status === 'REVIEWED';

  const answers = report.answers || [];
  const generalAnswers = answers.filter(a => a.type === 'general' || a.type === undefined);
  const customAnswers = answers.filter(a => a.type === 'custom');
  const signals = generalAnswers.filter(a => a.present === true);
  const highSignals = signals.filter(a => a.risk_level === 'HIGH');

  const ownerNote = report.general_notes || report.medical_notes || '';
  const phoneDigits = report.owner_phone ? report.owner_phone.replace(/\D/g, '') : '';

  return (
    <div className="animate-in fade-in duration-500">
      {/* Top bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => navigate('/vet/reports')}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-brand-600 transition-colors"
        >
          <ArrowLeft size={16} />
          Volver a reportes
        </button>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${calcMeta.chip}`}>
            Riesgo calculado: {riskLabel(report.calculated_risk)}
          </span>
          {report.validated_risk && (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-brand-100 text-brand-700">
              Validado: {riskLabel(report.validated_risk)}
            </span>
          )}
          {isReviewed && (
            <span className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700">
              <Check size={12} /> Revisado
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ===== Columna izquierda: paciente + validación ===== */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {report.patient_photo ? (
              <img src={report.patient_photo} alt={report.patient_name} className="w-full h-44 object-cover" />
            ) : (
              <div className="w-full h-44 bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-5xl">🐾</div>
            )}
            <div className="p-5">
              <h1 className="font-display text-2xl text-slate-800 leading-tight">{report.patient_name}</h1>
              <p className="text-sm text-brand-600 font-medium mt-1">{report.surgery_type}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Día {report.day_number} · {new Date(report.submitted_at).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-sm text-slate-600 mt-3 pt-3 border-t border-slate-100">
                <span className="text-slate-400">Propietario: </span>
                <span className="font-medium text-slate-700">{report.owner_name}</span>
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {report.owner_phone && (
                  <a href={`tel:${report.owner_phone}`} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors">
                    <Phone size={13} /> Llamar
                  </a>
                )}
                {phoneDigits && (
                  <a href={`https://wa.me/${phoneDigits}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors">
                    <MessageCircle size={13} /> WhatsApp
                  </a>
                )}
                {report.owner_email && (
                  <a href={`mailto:${report.owner_email}`} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors">
                    <Mail size={13} /> Correo
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Validación */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="font-display text-lg text-slate-800">Validación</h2>
            <p className="text-xs text-slate-500 mt-1">
              El sistema calculó riesgo <span className={`font-semibold ${calcMeta.icon}`}>{riskLabel(report.calculated_risk)}</span>.
              Puedes corregirlo si no estás de acuerdo (opcional).
            </p>

            <div className="flex gap-2 mt-4">
              {(['LOW', 'MEDIUM', 'HIGH'] as RiskKey[]).map(risk => (
                <button
                  key={risk}
                  onClick={() => setValidatedRisk(risk)}
                  className={`flex-1 px-2 py-2 rounded-lg text-xs font-semibold border transition-all ${
                    validatedRisk === risk
                      ? `${RISK_META[risk].chip} border-transparent ring-2 ring-offset-1 ring-brand-400`
                      : 'bg-white border-slate-200 text-slate-500 hover:border-brand-300'
                  }`}
                >
                  {RISK_META[risk].label}
                </button>
              ))}
            </div>

            <textarea
              placeholder="Justificación (opcional)"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              rows={2}
              className="w-full mt-3 p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-y"
            />

            <button
              onClick={handleValidate}
              disabled={!validatedRisk || isSaving}
              className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 disabled:opacity-50 transition-colors"
            >
              {isSaving ? (
                <><div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> Guardando…</>
              ) : (
                <>{report.validated_risk ? 'Actualizar corrección' : 'Guardar corrección de riesgo'}</>
              )}
            </button>

            <div className="mt-4 pt-4 border-t border-slate-100">
              {isReviewed ? (
                <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium">
                  <CheckCircle2 size={16} /> Reporte revisado
                </div>
              ) : (
                <button
                  onClick={handleMarkReviewed}
                  disabled={isMarkingReviewed}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-lg shadow-brand-600/20"
                >
                  {isMarkingReviewed ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Marcando…</>
                  ) : (
                    <><ClipboardCheck size={16} /> Marcar como revisado</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ===== Columna central: respuestas ===== */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-brand-400">
            Reporte de {report.owner_name}
          </p>
          <h2 className="font-display text-2xl text-slate-800 mt-1">Lo que nos reportó</h2>

          <div className="flex items-center gap-3 mt-3 text-xs">
            {highSignals.length > 0 && (
              <span className="flex items-center gap-1.5 text-red-600 bg-red-50 px-2.5 py-1 rounded-full font-medium">
                <AlertTriangle size={12} /> {highSignals.length} de riesgo alto
              </span>
            )}
            <span className="flex items-center gap-1.5 text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full font-medium">
              {signals.length} señal(es) de {generalAnswers.length} preguntas
            </span>
          </div>

          {generalAnswers.length > 0 ? (
            <div className="space-y-2 mt-5">
              {generalAnswers.map(a => <GeneralAnswerRow key={a.id} answer={a} />)}
            </div>
          ) : (
            <p className="text-sm text-slate-400 mt-5">Este reporte no tiene respuestas registradas.</p>
          )}

          {/* Preguntas del veterinario (personalizadas, texto libre) */}
          {customAnswers.length > 0 && (
            <div className="mt-7 pt-6 border-t border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Preguntas del veterinario</h3>
              <div className="space-y-4">
                {customAnswers.map(a => (
                  <div key={a.id}>
                    <p className="text-sm font-medium text-slate-700">{a.question_text}</p>
                    <p className="text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-lg p-3 mt-1.5 whitespace-pre-wrap">
                      {a.value?.trim() ? a.value : <span className="text-slate-400">Sin respuesta</span>}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ===== Columna derecha: evidencia + nota ===== */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-4">
              <ImageIcon size={16} className="text-slate-400" /> Fotos enviadas
            </h3>
            {report.evidences && report.evidences.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {report.evidences.map(ev => <ImageGalleryItem key={ev.id} evidence={ev} />)}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No se adjuntaron fotos en este reporte.</p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Nota de {report.owner_name}</h3>
            {ownerNote.trim() ? (
              <blockquote className="border-l-4 border-brand-200 bg-brand-50/40 rounded-r-lg pl-4 pr-3 py-3 text-sm text-slate-700 italic leading-relaxed whitespace-pre-wrap">
                "{ownerNote}"
              </blockquote>
            ) : (
              <p className="text-sm text-slate-400">El propietario no dejó observaciones adicionales.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
