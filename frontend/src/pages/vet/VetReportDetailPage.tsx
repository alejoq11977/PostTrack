import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertTriangle, Phone, Mail, MessageSquare, X, Check, ZoomIn } from 'lucide-react';
import { vetService, VetReport, VetEvidence } from '@/features/vet/api/vet.service';

const RISK_STYLES = {
  HIGH: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', badge: 'bg-red-100 text-red-700' },
  MEDIUM: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-700' },
  LOW: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600', badge: 'bg-green-100 text-green-700' },
};

function ImageGalleryItem({ evidence }: { evidence: VetEvidence }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 group hover:ring-2 ring-brand-500 transition-all"
      >
        <img
          src={evidence.image_url}
          alt="Evidencia"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-colors">
          <ZoomIn size={24} className="text-white opacity-0 group-hover:opacity-100" />
        </div>
      </button>

      {isOpen && (
        <ImageModal evidence={evidence} onClose={() => setIsOpen(false)} />
      )}
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
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
      onClick={onClose}
    >
      {/* Header with controls */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
        <span className="text-white text-sm">Evidencia #{evidence.id}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <span className="text-xl font-bold">−</span>
          </button>
          <span className="text-white text-sm w-16 text-center">{Math.round(scale * 100)}%</span>
          <button
            onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <span className="text-xl font-bold">+</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleReset(); }}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors ml-2"
          >
            <span className="text-xs font-medium">Reset</span>
          </button>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors ml-4"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Image container */}
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
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
          }}
          draggable={false}
        />
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs">
        Scroll para hacer zoom · Arrastra para mover · Clic fuera para cerrar
      </div>
    </div>
  );
}

function FloatingNotification({
  show,
  onClose,
  children
}: {
  show: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-4 w-80 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-slate-800 mb-1">Validar Clasificación</h4>
            <p className="text-xs text-slate-500 mb-3">¿La clasificación de riesgo es correcta?</p>
            {children}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export const VetReportDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<VetReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showValidateNotification, setShowValidateNotification] = useState(false);
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
        if (data.validated_risk) {
          setValidatedRisk(data.validated_risk);
        }
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
      await vetService.validateReport(parseInt(id), {
        validated_risk: validatedRisk,
        justification,
      });
      setReport(prev => prev ? { ...prev, validated_risk: validatedRisk } : null);
      setShowValidateNotification(false);
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
        <div className="h-48 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  const riskConfig = RISK_STYLES[report.calculated_risk as keyof typeof RISK_STYLES] || RISK_STYLES.LOW;

  return (
    <div className="animate-in fade-in duration-500">
      {/* Floating Validation Notification */}
      <FloatingNotification
        show={showValidateNotification}
        onClose={() => setShowValidateNotification(false)}
      >
        <div className="flex gap-2 mb-3">
          {['LOW', 'MEDIUM', 'HIGH'].map(risk => (
            <button
              key={risk}
              onClick={() => setValidatedRisk(risk)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                validatedRisk === risk
                  ? `${RISK_STYLES[risk as keyof typeof RISK_STYLES].badge} ring-2 ring-offset-2 ring-brand-500`
                  : 'bg-slate-100 border border-slate-200 text-slate-600 hover:border-brand-300'
              }`}
            >
              {risk}
            </button>
          ))}
        </div>

        <textarea
          placeholder="Justificación (opcional)"
          value={justification}
          onChange={(e) => setJustification(e.target.value)}
          className="w-full p-2 border border-slate-200 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
          rows={2}
        />

        <div className="flex gap-2">
          <button
            onClick={() => setShowValidateNotification(false)}
            className="flex-1 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleValidate}
            disabled={!validatedRisk || isSaving}
            className="flex-1 px-3 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Check size={14} />
                Guardar
              </>
            )}
          </button>
        </div>
      </FloatingNotification>

      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/vet/reports')}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-brand-600 mb-4 transition-colors"
        >
          <ArrowLeft size={16} />
          Volver a reportes
        </button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl ${riskConfig.bg} flex items-center justify-center`}>
              {report.calculated_risk === 'HIGH' && <AlertTriangle size={28} className={riskConfig.text} />}
              {report.calculated_risk === 'MEDIUM' && <AlertTriangle size={28} className={riskConfig.text} />}
              {report.calculated_risk === 'LOW' && <CheckCircle size={28} className={riskConfig.text} />}
            </div>
            <div>
              <h1 className="text-2xl font-display font-semibold text-slate-800">{report.patient_name}</h1>
              <p className="text-slate-500">{report.surgery_type} · Día {report.day_number}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {report.validated_risk && (
              <span className="text-sm px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                Validado: {report.validated_risk}
              </span>
            )}
            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${riskConfig.badge}`}>
              {report.calculated_risk || 'SIN DATOS'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient & Owner Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Contacto</h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {report.patient_photo ? (
                <img src={report.patient_photo} alt={report.patient_name} className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-2xl">
                  🐕
                </div>
              )}
              <div>
                <p className="font-semibold text-slate-800">{report.owner_name}</p>
                <p className="text-sm text-slate-500">Propietario</p>
              </div>
            </div>

            {report.owner_phone && (
              <a
                href={`tel:${report.owner_phone}`}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-brand-50 transition-colors"
              >
                <Phone size={18} className="text-brand-500" />
                <span className="text-slate-700">{report.owner_phone}</span>
              </a>
            )}

            {report.owner_email && (
              <a
                href={`mailto:${report.owner_email}`}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-brand-50 transition-colors"
              >
                <Mail size={18} className="text-brand-500" />
                <span className="text-slate-700">{report.owner_email}</span>
              </a>
            )}

            <button className="flex items-center gap-3 p-3 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors w-full">
              <MessageSquare size={18} className="text-brand-600" />
              <span className="text-brand-700 font-medium">Enviar mensaje</span>
            </button>
          </div>
        </div>

        {/* Report Details */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Información del Reporte</h2>
            {report.review_status === 'REVIEWED' ? (
              <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                <CheckCircle size={12} />
                Revisado
              </span>
            ) : (
              <button
                onClick={handleMarkReviewed}
                disabled={isMarkingReviewed}
                className="flex items-center gap-1 text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-full hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {isMarkingReviewed ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Marcando...
                  </>
                ) : (
                  <>
                    <Check size={12} />
                    Marcar como Revisado
                  </>
                )}
              </button>
            )}
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">Fecha de envío</p>
                <p className="text-slate-700">{new Date(report.submitted_at).toLocaleString('es-CO')}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Riesgo calculado</p>
                <p className={`font-semibold ${riskConfig.text}`}>{report.calculated_risk || 'N/A'}</p>
              </div>
            </div>

            {report.medical_notes && (
              <div>
                <p className="text-xs text-slate-400 mb-1">Notas del propietario</p>
                <p className="text-slate-700 bg-slate-50 p-3 rounded-lg">{report.medical_notes}</p>
              </div>
            )}

            {report.validated_risk && (
              <div>
                <p className="text-xs text-slate-400 mb-1">Validación veterinaria</p>
                <p className="font-semibold text-emerald-600">{report.validated_risk}</p>
              </div>
            )}

            {/* Questions & Answers Section */}
            <div className="border-t border-slate-100 pt-6">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Preguntas y Respuestas</h3>

              {/* General Questions */}
              {report.general_questions && report.general_questions.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-xs font-medium text-slate-400 uppercase mb-3">Preguntas Generales</h4>
                  <div className="space-y-3">
                    {report.general_questions.map((question) => {
                      const answer = report.answers?.find(a =>
                        a.question_text === question.text ||
                        a.question_text.includes(question.text.substring(0, 50))
                      );
                      return (
                        <div key={question.id} className="bg-slate-50 rounded-lg p-4">
                          <p className="text-sm font-medium text-slate-700 mb-2">{question.text}</p>
                          {question.instruction_text && (
                            <p className="text-xs text-slate-400 mb-2">{question.instruction_text}</p>
                          )}
                          <p className="text-slate-600 font-medium">
                            Respuesta: <span className={answer?.value === 'YES' ? 'text-emerald-600' : answer?.value === 'NO' ? 'text-red-600' : 'text-slate-800'}>{answer?.value === 'YES' ? 'Sí' : answer?.value === 'NO' ? 'No' : answer?.value || 'Sin respuesta'}</span>
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Custom Questions */}
              {report.custom_questions && report.custom_questions.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-xs font-medium text-slate-400 uppercase mb-3">Preguntas Personalizadas</h4>
                  <div className="space-y-3">
                    {report.custom_questions.map((question) => {
                      const answer = report.answers?.find(a =>
                        a.question_text === question.text ||
                        a.question_text.includes(question.text.substring(0, 50))
                      );
                      return (
                        <div key={question.id} className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                          <p className="text-sm font-medium text-blue-700 mb-2">{question.text}</p>
                          {question.instruction_text && (
                            <p className="text-xs text-blue-400 mb-2">{question.instruction_text}</p>
                          )}
                          <p className="text-blue-600 font-medium">
                            Respuesta: <span className="text-blue-800">{answer?.value || 'Sin respuesta'}</span>
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* General Notes */}
              {report.general_notes && (
                <div className="mb-6">
                  <h4 className="text-xs font-medium text-slate-400 uppercase mb-3">Notas del Propietario</h4>
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                    <p className="text-slate-700">{report.general_notes}</p>
                  </div>
                </div>
              )}

              {/* All Answers (fallback if questions not available) */}
              {!report.general_questions?.length && !report.custom_questions?.length && report.answers && report.answers.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-xs font-medium text-slate-400 uppercase mb-3">Respuestas</h4>
                  <div className="space-y-3">
                    {report.answers.map((answer) => (
                      <div key={answer.id} className="bg-slate-50 rounded-lg p-4">
                        <p className="text-sm font-medium text-slate-700 mb-1">{answer.question_text}</p>
                        <p className="text-slate-600">{answer.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Evidences / Images Section */}
            {report.evidences && report.evidences.length > 0 && (
              <div className="border-t border-slate-100 pt-6">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Evidencias Fotográficas</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {report.evidences.map((evidence) => (
                    <ImageGalleryItem key={evidence.id} evidence={evidence} />
                  ))}
                </div>
              </div>
            )}

            {/* Validation trigger */}
            <div className="border-t border-slate-100 pt-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  {report.validated_risk
                    ? `Validado con riesgo: ${report.validated_risk}`
                    : 'Aún no se ha validado la clasificación'}
                </p>
              </div>
              <button
                onClick={() => setShowValidateNotification(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
              >
                <AlertTriangle size={16} />
                {report.validated_risk ? 'Corregir validación' : 'Validar clasificación'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};