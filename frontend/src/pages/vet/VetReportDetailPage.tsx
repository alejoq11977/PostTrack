import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertTriangle, Phone, Mail, MessageSquare } from 'lucide-react';
import { vetService, VetReport } from '@/features/vet/api/vet.service';

const RISK_STYLES = {
  HIGH: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', badge: 'bg-red-100 text-red-700' },
  MEDIUM: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-700' },
  LOW: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600', badge: 'bg-green-100 text-green-700' },
};

export const VetReportDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<VetReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showValidate, setShowValidate] = useState(false);
  const [validatedRisk, setValidatedRisk] = useState('');
  const [justification, setJustification] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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
      setReport(prev => prev ? { ...prev, validated_risk: validatedRisk, review_status: 'REVIEWED' } : null);
      setShowValidate(false);
    } catch (err) {
      console.error('Error validating report:', err);
    } finally {
      setIsSaving(false);
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

          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${riskConfig.badge}`}>
            {report.calculated_risk || 'SIN DATOS'}
          </span>
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
            {report.review_status === 'REVIEWED' && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                <CheckCircle size={12} />
                Validado
              </span>
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

            {/* Validation section */}
            <div className="border-t border-slate-100 pt-6">
              {!showValidate ? (
                <button
                  onClick={() => setShowValidate(true)}
                  className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                >
                  {report.validated_risk ? 'Corregir validación' : '¿La clasificación es correcta?'}
                </button>
              ) : (
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-slate-700 mb-3">¿La clasificación de riesgo es correcta?</p>

                  <div className="flex gap-2 mb-3">
                    {['LOW', 'MEDIUM', 'HIGH'].map(risk => (
                      <button
                        key={risk}
                        onClick={() => setValidatedRisk(risk)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          validatedRisk === risk
                            ? ` ${RISK_STYLES[risk as keyof typeof RISK_STYLES].badge} ring-2 ring-offset-2 ring-brand-500`
                            : 'bg-white border border-slate-200 text-slate-600 hover:border-brand-300'
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
                    className="w-full p-3 border border-slate-200 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    rows={2}
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowValidate(false)}
                      className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleValidate}
                      disabled={!validatedRisk || isSaving}
                      className="px-4 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
                    >
                      {isSaving ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};