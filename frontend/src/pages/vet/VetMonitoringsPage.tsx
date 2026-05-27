import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Stethoscope, Clock, AlertTriangle, Dog, LogOut, CheckCircle2, CalendarClock, Home, Eye, FileText, Trash2, MessageSquarePlus, ArrowLeft } from 'lucide-react';
import { vetService, VetMonitoring } from '@/features/vet/api/vet.service';

type SearchMode = 'owner' | 'patient';

const FREQUENCY_PRESETS = [12, 24, 48, 72];

function formatDistanceToNow(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Hace un momento';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('es-ES', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// Valor para <input type="datetime-local"> a partir de "ahora" (zona horaria local).
function nowForInput(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

interface SearchResult {
  id: number;
  type: 'owner' | 'patient';
  name: string;
  secondary?: string;
  phone?: string | null;
  photo_url?: string | null;
  species?: string;
  breed?: string;
  owner_id?: number;
  owner_email?: string;
  owner_identification_number?: string;
}

function statusBadge(monitoring: VetMonitoring) {
  if (monitoring.status === 'DISCHARGED') {
    return { label: 'Dado de alta', className: 'bg-slate-100 text-slate-600 border border-slate-200' };
  }
  if (!monitoring.home_release_date) {
    return { label: 'En clínica', className: 'bg-sky-50 text-sky-600 border border-sky-200' };
  }
  return { label: 'Activo · en casa', className: 'bg-emerald-50 text-emerald-600 border border-emerald-200' };
}

function MonitoringCard({
  monitoring,
  onViewInfo,
  onRelease,
  onDischarge,
}: {
  monitoring: VetMonitoring;
  onViewInfo: () => void;
  onRelease: () => void;
  onDischarge: () => void;
}) {
  const navigate = useNavigate();
  const badge = statusBadge(monitoring);
  const isActive = monitoring.status !== 'DISCHARGED';
  const notReleased = isActive && !monitoring.home_release_date;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-brand-300 hover:shadow-lg transition-all duration-200">
      {/* Resumen: al hacer clic abre la información completa del seguimiento */}
      <button onClick={onViewInfo} className="w-full text-left group">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20 shrink-0">
            <Stethoscope size={22} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-800 text-lg leading-tight group-hover:text-brand-700 transition-colors">{monitoring.patient_name || 'Sin paciente'}</h3>
                <p className="text-sm text-brand-600 font-medium mt-0.5">{monitoring.surgery_type || 'N/A'}</p>
              </div>
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full shrink-0 ${badge.className}`}>
                {badge.label}
              </span>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              <span className="font-medium text-slate-700">{monitoring.owner_name || 'Sin propietario'}</span>
              {monitoring.owner_identification_number && (
                <span className="text-slate-400"> · {monitoring.owner_identification_number}</span>
              )}
            </p>
            {monitoring.owner_email && (
              <p className="text-xs text-slate-400 mt-0.5">{monitoring.owner_email}</p>
            )}

            <div className="flex flex-wrap items-center gap-2 text-xs mt-3">
              {monitoring.surgery_date && (
                <span className="flex items-center gap-1.5 text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full">
                  <Clock size={12} />
                  Cirugía: {formatDistanceToNow(monitoring.surgery_date)}
                  {monitoring.days_since_surgery != null && ` · ${monitoring.days_since_surgery}d`}
                </span>
              )}
              {monitoring.home_release_date ? (
                <span className="flex items-center gap-1.5 text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full">
                  <Home size={12} />
                  Salida: {formatDistanceToNow(monitoring.home_release_date)}
                  {monitoring.days_since_release != null && ` · ${monitoring.days_since_release}d`}
                </span>
              ) : isActive && (
                <span className="flex items-center gap-1.5 text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full">
                  <Home size={12} />
                  Aún no sale de la clínica
                </span>
              )}
              {monitoring.active_reports > 0 && (
                <span className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                  <AlertTriangle size={12} />
                  {monitoring.active_reports} pendiente(s)
                </span>
              )}
            </div>
          </div>
        </div>
      </button>

      {/* Acciones */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-4 border-t border-slate-100">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onViewInfo}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
          >
            <Eye size={14} />
            Ver información
          </button>
          <button
            onClick={() => navigate(`/vet/reports?monitoring=${monitoring.id}`)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-lg transition-colors"
          >
            <FileText size={14} />
            Ver reportes
          </button>
        </div>

        {isActive && (
          <div className="flex flex-wrap gap-2">
            {notReleased && (
              <button
                onClick={onRelease}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors"
              >
                <Home size={14} />
                Marcar salida
              </button>
            )}
            <button
              onClick={onDischarge}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
            >
              <CheckCircle2 size={14} />
              Dar de alta
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-xs text-slate-400 shrink-0">{label}</span>
      <span className="text-sm text-slate-700 font-medium text-right break-words">{value}</span>
    </div>
  );
}

function MonitoringDetailModal({
  monitoring,
  onClose,
}: {
  monitoring: VetMonitoring;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const badge = statusBadge(monitoring);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-start justify-between gap-3 p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20 shrink-0">
              <Stethoscope size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-slate-800 truncate">{monitoring.patient_name || 'Sin paciente'}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm text-brand-600 font-medium truncate">{monitoring.surgery_type || 'N/A'}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${badge.className}`}>{badge.label}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors shrink-0">✕</button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          <section>
            <p className="text-[11px] font-bold tracking-widest uppercase text-slate-400 mb-1">Propietario</p>
            <div className="divide-y divide-slate-50">
              <DetailRow label="Nombre" value={monitoring.owner_name || '—'} />
              {monitoring.owner_identification_number && (
                <DetailRow label="Identificación" value={monitoring.owner_identification_number} />
              )}
              {monitoring.owner_email && <DetailRow label="Correo" value={monitoring.owner_email} />}
            </div>
          </section>

          <section>
            <p className="text-[11px] font-bold tracking-widest uppercase text-slate-400 mb-1">Cirugía</p>
            <div className="divide-y divide-slate-50">
              <DetailRow label="Tipo" value={monitoring.surgery_type || '—'} />
              <DetailRow label="Fecha y hora" value={monitoring.surgery_date ? formatDateTime(monitoring.surgery_date) : '—'} />
              <DetailRow label="Días desde la cirugía" value={monitoring.days_since_surgery != null ? `${monitoring.days_since_surgery} día(s)` : '—'} />
            </div>
          </section>

          <section>
            <p className="text-[11px] font-bold tracking-widest uppercase text-slate-400 mb-1">Salida a casa</p>
            {monitoring.home_release_date ? (
              <div className="divide-y divide-slate-50">
                <DetailRow label="Fecha y hora" value={formatDateTime(monitoring.home_release_date)} />
                <DetailRow label="Días desde la salida" value={monitoring.days_since_release != null ? `${monitoring.days_since_release} día(s)` : '—'} />
              </div>
            ) : (
              <div className="flex items-start gap-2 bg-sky-50 border border-sky-100 rounded-lg p-3 text-sm text-sky-800">
                <Home size={16} className="shrink-0 mt-0.5 text-sky-500" />
                <span>Aún en la clínica. No se esperan reportes hasta marcar la salida a casa.</span>
              </div>
            )}
          </section>

          <section>
            <p className="text-[11px] font-bold tracking-widest uppercase text-slate-400 mb-1">Seguimiento</p>
            <div className="divide-y divide-slate-50">
              <DetailRow label="Frecuencia de reportes" value={`Cada ${monitoring.report_frequency_hours} ${monitoring.report_frequency_hours === 1 ? 'hora' : 'horas'}`} />
              <DetailRow label="Reportes pendientes" value={String(monitoring.active_reports)} />
              <DetailRow label="Estado" value={badge.label} />
              {monitoring.discharged_at && (
                <DetailRow label="Dado de alta" value={formatDateTime(monitoring.discharged_at)} />
              )}
            </div>
          </section>
        </div>

        <div className="p-6 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={() => navigate(`/vet/reports?monitoring=${monitoring.id}`)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/20"
          >
            <FileText size={16} />
            Ver reportes
          </button>
        </div>
      </div>
    </div>
  );
}

export const VetMonitoringsPage = () => {
  const [searchMode, setSearchMode] = useState<SearchMode>('owner');
  const [searchQuery, setSearchQuery] = useState('');
  const [monitorings, setMonitorings] = useState<VetMonitoring[]>([]);
  const [filteredMonitorings, setFilteredMonitorings] = useState<VetMonitoring[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [infoTarget, setInfoTarget] = useState<VetMonitoring | null>(null);
  const [releaseTarget, setReleaseTarget] = useState<VetMonitoring | null>(null);
  const [dischargeTarget, setDischargeTarget] = useState<VetMonitoring | null>(null);

  useEffect(() => {
    document.title = 'Seguimientos - PostTrack';
  }, []);

  useEffect(() => {
    loadMonitorings();
  }, []);

  const loadMonitorings = async () => {
    setLoading(true);
    try {
      const data = await vetService.getMonitorings();
      setMonitorings(data);
      setFilteredMonitorings(data);
    } catch (error) {
      console.error('Error loading monitorings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMonitorings(monitorings);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      if (searchMode === 'owner') {
        setFilteredMonitorings(monitorings.filter(m =>
          m.owner_name?.toLowerCase().includes(lowerQuery)
        ));
      } else {
        setFilteredMonitorings(monitorings.filter(m =>
          m.patient_name?.toLowerCase().includes(lowerQuery)
        ));
      }
    }
  }, [searchQuery, searchMode, monitorings]);

  const handleCreateMonitoring = async (data: {
    patientId: number;
    surgeryType: string;
    surgeryDate: string;
    homeReleaseDate: string;
    frequency: number;
    customQuestions: { text: string; instruction_text: string }[];
  }) => {
    try {
      await vetService.createMonitoring({
        patient_id: data.patientId,
        surgery_type: data.surgeryType,
        surgery_date: data.surgeryDate,
        home_release_date: data.homeReleaseDate || null,
        report_frequency_hours: data.frequency,
        status: 'ACTIVE',
        custom_questions: data.customQuestions
          .map(q => ({ text: q.text.trim(), instruction_text: q.instruction_text.trim() }))
          .filter(q => q.text.length > 0),
      });
      setShowCreateModal(false);
      loadMonitorings();
    } catch (error) {
      console.error('Error creating monitoring:', error);
    }
  };

  const handleRelease = async (id: number, date: string) => {
    try {
      await vetService.releaseMonitoring(id, date || undefined);
      setReleaseTarget(null);
      loadMonitorings();
    } catch (error) {
      console.error('Error releasing monitoring:', error);
    }
  };

  const handleDischarge = async (id: number) => {
    try {
      await vetService.dischargeMonitoring(id);
      setDischargeTarget(null);
      loadMonitorings();
    } catch (error) {
      console.error('Error discharging monitoring:', error);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-display font-semibold text-slate-800 tracking-tight">
            Seguimientos
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Crea y gestiona seguimientos quirúrgicos
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/20 hover:shadow-brand-600/30 font-medium"
        >
          <Plus size={20} />
          Nuevo Seguimiento
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setSearchMode('owner')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                searchMode === 'owner'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Por Propietario
            </button>
            <button
              onClick={() => setSearchMode('patient')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                searchMode === 'patient'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Por Paciente
            </button>
          </div>
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={searchMode === 'owner' ? 'Nombre, correo o número de ID...' : 'Buscar por nombre de paciente...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Cargando seguimientos...</p>
        </div>
      ) : monitorings.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Stethoscope size={48} className="text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">No hay seguimientos registrados</p>
          <p className="text-slate-400 text-sm mt-1">Crea un nuevo seguimiento para comenzar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMonitorings.map((monitoring) => (
            <MonitoringCard
              key={monitoring.id}
              monitoring={monitoring}
              onViewInfo={() => setInfoTarget(monitoring)}
              onRelease={() => setReleaseTarget(monitoring)}
              onDischarge={() => setDischargeTarget(monitoring)}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateMonitoringModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateMonitoring}
        />
      )}

      {infoTarget && (
        <MonitoringDetailModal
          monitoring={infoTarget}
          onClose={() => setInfoTarget(null)}
        />
      )}

      {releaseTarget && (
        <ReleaseModal
          monitoring={releaseTarget}
          onClose={() => setReleaseTarget(null)}
          onConfirm={(date) => handleRelease(releaseTarget.id, date)}
        />
      )}

      {dischargeTarget && (
        <DischargeModal
          monitoring={dischargeTarget}
          onClose={() => setDischargeTarget(null)}
          onConfirm={() => handleDischarge(dischargeTarget.id)}
        />
      )}
    </div>
  );
};

function ReleaseModal({
  monitoring,
  onClose,
  onConfirm,
}: {
  monitoring: VetMonitoring;
  onClose: () => void;
  onConfirm: (date: string) => void;
}) {
  const [date, setDate] = useState(nowForInput());
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-sky-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-100 flex items-center justify-center">
              <Home size={20} className="text-sky-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Marcar salida a casa</h2>
              <p className="text-sm text-slate-500">{monitoring.patient_name}</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">
            A partir de esta fecha y hora, el propietario podrá enviar reportes y se comenzará a
            calcular el agendamiento de seguimiento.
          </p>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Fecha y hora de salida</label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50/50"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={() => { setSubmitting(true); onConfirm(date); }}
              disabled={!date || submitting}
              className="flex-1 px-4 py-3 bg-sky-600 text-white rounded-xl text-sm font-medium hover:bg-sky-700 disabled:opacity-50 transition-all shadow-lg shadow-sky-600/20"
            >
              Confirmar salida
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DischargeModal({
  monitoring,
  onClose,
  onConfirm,
}: {
  monitoring: VetMonitoring;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center">
              <LogOut size={20} className="text-slate-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Dar de alta</h2>
              <p className="text-sm text-slate-500">{monitoring.patient_name}</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">
            Esto <span className="font-semibold text-slate-800">finaliza el seguimiento postoperatorio</span>.
            Se dejará de esperar reportes y el propietario ya no podrá enviar nuevos. Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={() => { setSubmitting(true); onConfirm(); }}
              disabled={submitting}
              className="flex-1 px-4 py-3 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-900 disabled:opacity-50 transition-all shadow-lg"
            >
              Finalizar seguimiento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateMonitoringModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: {
    patientId: number;
    surgeryType: string;
    surgeryDate: string;
    homeReleaseDate: string;
    frequency: number;
    customQuestions: { text: string; instruction_text: string }[];
  }) => void;
}) {
  const [searchMode, setSearchMode] = useState<SearchMode>('owner');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<{ id: number; name: string; owner_name?: string } | null>(null);
  const [surgeryType, setSurgeryType] = useState('');
  const [surgeryDate, setSurgeryDate] = useState('');
  const [homeReleaseDate, setHomeReleaseDate] = useState('');
  const [frequencyMode, setFrequencyMode] = useState<'preset' | 'custom'>('preset');
  const [frequency, setFrequency] = useState(24);
  const [customHours, setCustomHours] = useState('');
  const [customQuestions, setCustomQuestions] = useState<{ text: string; instruction_text: string }[]>([]);
  const [step, setStep] = useState<'search' | 'details'>('search');
  const [isSearching, setIsSearching] = useState(false);

  const addCustomQuestion = () => setCustomQuestions(prev => [...prev, { text: '', instruction_text: '' }]);
  const updateCustomQuestion = (index: number, field: 'text' | 'instruction_text', value: string) =>
    setCustomQuestions(prev => prev.map((q, i) => (i === index ? { ...q, [field]: value } : q)));
  const removeCustomQuestion = (index: number) =>
    setCustomQuestions(prev => prev.filter((_, i) => i !== index));

  const customHoursTrimmed = customHours.trim();
  const customHoursValid = /^\d+$/.test(customHoursTrimmed) && parseInt(customHoursTrimmed, 10) >= 1;
  const frequencyValid = frequencyMode === 'preset' || customHoursValid;
  const effectiveFrequency = frequencyMode === 'custom' ? parseInt(customHoursTrimmed, 10) : frequency;

  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        if (searchMode === 'owner') {
          const owners = await vetService.searchOwners(searchQuery);
          const allPatients: SearchResult[] = [];
          for (const owner of owners.slice(0, 5)) {
            if (owner.patients && owner.patients.length > 0) {
              for (const p of owner.patients) {
                allPatients.push({
                  id: p.id,
                  type: 'patient' as const,
                  name: p.name,
                  secondary: owner.full_name,
                  phone: owner.phone_number || null,
                  photo_url: p.photo_url,
                  species: p.species,
                  breed: p.breed,
                  owner_id: owner.id,
                  owner_email: owner.email,
                  owner_identification_number: owner.identification_number || undefined,
                });
              }
            }
          }
          setSearchResults(allPatients);
        } else {
          const patients = await vetService.searchPatients(searchQuery);
          setSearchResults(patients.map((p: any) => ({
            id: p.id,
            type: 'patient' as const,
            name: p.name,
            secondary: p.owner_name || '',
            phone: p.owner_phone || null,
            photo_url: p.photo_url,
            species: p.species,
            breed: p.breed,
            owner_id: p.owner_id,
            owner_email: p.owner_email,
            owner_identification_number: p.owner_identification_number,
          })));
        }
      } catch (error) {
        console.error('Error searching:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchMode]);

  const handleSelectPatient = (result: SearchResult) => {
    setSelectedPatient({ id: result.id, name: result.name, owner_name: result.secondary || undefined });
    setStep('details');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPatient && surgeryType && surgeryDate && frequencyValid) {
      onCreate({
        patientId: selectedPatient.id,
        surgeryType,
        surgeryDate,
        homeReleaseDate,
        frequency: effectiveFrequency,
        customQuestions,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-3xl shadow-2xl w-full max-h-[90vh] overflow-hidden flex flex-col ${step === 'details' ? 'max-w-3xl' : 'max-w-xl'}`}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Nuevo Seguimiento</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {step === 'search' ? 'Busca y selecciona un paciente' : 'Completa los datos del seguimiento'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
            ✕
          </button>
        </div>

        {step === 'search' && (
          <div className="p-6 overflow-y-auto">
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-5">
              <button
                onClick={() => { setSearchMode('owner'); setSearchQuery(''); setSearchResults([]); }}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  searchMode === 'owner'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Por Propietario
              </button>
              <button
                onClick={() => { setSearchMode('patient'); setSearchQuery(''); setSearchResults([]); }}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  searchMode === 'patient'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Por Paciente
              </button>
            </div>

            <div className="relative mb-5">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={searchMode === 'owner' ? 'Nombre, correo o número de ID...' : 'Nombre del paciente...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-slate-50/50"
                autoFocus
              />
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {isSearching && (
                <div className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Buscando...</p>
                </div>
              )}
              {!isSearching && searchResults.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelectPatient(result)}
                  className="w-full p-4 bg-slate-50 hover:bg-brand-50 border border-transparent hover:border-brand-200 rounded-xl text-left transition-all"
                >
                  <div className="flex items-center gap-3">
                    {result.photo_url ? (
                      <img src={result.photo_url} alt={result.name} className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center">
                        <Dog size={20} className="text-brand-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800">{result.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {result.species || 'Mascota'}{result.breed ? ` · ${result.breed}` : ''}
                      </p>
                      {result.secondary && (
                        <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                          <span>👤</span> {result.secondary}
                          {result.owner_identification_number && (
                            <span className="text-slate-400"> · {result.owner_identification_number}</span>
                          )}
                        </p>
                      )}
                      {result.owner_email && (
                        <p className="text-xs text-slate-400 mt-0.5">{result.owner_email}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
              {!isSearching && searchQuery && searchResults.length === 0 && (
                <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <Search size={32} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No se encontraron resultados</p>
                  <p className="text-xs text-slate-400 mt-1">Intenta con otro nombre</p>
                </div>
              )}
              {!searchQuery && (
                <div className="text-center py-10">
                  <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Search size={24} className="text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-500">Escribe para buscar</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {searchMode === 'owner' ? 'Busca por nombre del propietario' : 'Busca por nombre del paciente'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'details' && (
          <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col md:flex-row">

              {/* Riel izquierdo: paciente */}
              <aside className="md:w-64 lg:w-72 shrink-0 bg-slate-50/70 border-b md:border-b-0 md:border-r border-slate-100 p-6 md:p-7 space-y-4">
                <div className="p-4 bg-gradient-to-br from-brand-50 to-white border border-brand-100 rounded-2xl">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20 mb-3">
                    <Dog size={20} className="text-white" />
                  </div>
                  <p className="text-[11px] font-bold tracking-widest uppercase text-brand-500 mb-1">Paciente</p>
                  <p className="font-semibold text-slate-800 text-lg leading-tight break-words">{selectedPatient?.name}</p>
                  {selectedPatient?.owner_name && (
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-1 break-words">
                      <span>👤</span> {selectedPatient.owner_name}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setStep('search')}
                  className="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors inline-flex items-center gap-1"
                >
                  <ArrowLeft size={13} /> Cambiar paciente
                </button>
              </aside>

              {/* Panel derecho: campos */}
              <div className="flex-1 min-w-0 p-6 md:p-7 space-y-7">

                {/* Sección: datos de la cirugía */}
                <section className="space-y-4">
                  <p className="text-[11px] font-bold tracking-widest uppercase text-slate-400">Datos de la cirugía</p>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Tipo de cirugía *</label>
                    <input
                      type="text"
                      value={surgeryType}
                      onChange={(e) => setSurgeryType(e.target.value)}
                      placeholder="Ej: Esterilización, Castración, Tumores..."
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-slate-50/50"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">Fecha y hora de cirugía *</label>
                      <input
                        type="datetime-local"
                        value={surgeryDate}
                        onChange={(e) => setSurgeryDate(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-slate-50/50"
                        required
                      />
                      <p className="text-xs text-slate-400 mt-1 flex items-start gap-1">
                        <CalendarClock size={12} className="shrink-0 mt-0.5" /> Define las ventanas de riesgo postoperatorio.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">Fecha y hora de salida a casa</label>
                      <input
                        type="datetime-local"
                        value={homeReleaseDate}
                        onChange={(e) => setHomeReleaseDate(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-slate-50/50"
                      />
                      <p className="text-xs text-slate-400 mt-1 flex items-start gap-1">
                        <Home size={12} className="shrink-0 mt-0.5" /> Opcional. Solo se esperan reportes después de la salida.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Sección: reportes del propietario */}
                <section className="space-y-4">
                  <p className="text-[11px] font-bold tracking-widest uppercase text-slate-400">Reportes del propietario</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">Frecuencia de reportes</label>
                      <select
                        value={frequencyMode === 'custom' ? 'custom' : frequency}
                        onChange={(e) => {
                          if (e.target.value === 'custom') {
                            setFrequencyMode('custom');
                          } else {
                            setFrequencyMode('preset');
                            setFrequency(parseInt(e.target.value, 10));
                          }
                        }}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-slate-50/50"
                      >
                        {FREQUENCY_PRESETS.map((h) => (
                          <option key={h} value={h}>Cada {h} horas</option>
                        ))}
                        <option value="custom">Personalizado…</option>
                      </select>
                    </div>

                    {frequencyMode === 'custom' && (
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Horas personalizadas</label>
                        <div className="relative">
                          <input
                            type="number"
                            min={1}
                            step={1}
                            value={customHours}
                            onChange={(e) => setCustomHours(e.target.value)}
                            placeholder="Ej: 36"
                            className={`w-full px-4 py-3 pr-16 border rounded-xl text-sm focus:outline-none focus:ring-2 bg-slate-50/50 ${
                              customHoursTrimmed && !customHoursValid
                                ? 'border-red-300 focus:ring-red-400 focus:border-red-400'
                                : 'border-slate-200 focus:ring-brand-500 focus:border-brand-500'
                            }`}
                            autoFocus
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">horas</span>
                        </div>
                        {customHoursTrimmed && !customHoursValid && (
                          <p className="text-xs text-red-500 mt-1">Ingrese un número entero de horas válido (mínimo 1).</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Preguntas personalizadas <span className="text-slate-400 font-normal">(opcional)</span>
                    </label>
                    <p className="text-xs text-slate-400 mb-2 flex items-start gap-1">
                      <MessageSquarePlus size={12} className="shrink-0 mt-0.5" /> Preguntas adicionales que el propietario responderá en cada reporte de este seguimiento.
                    </p>

                    {customQuestions.length === 0 ? (
                      <button
                        type="button"
                        onClick={addCustomQuestion}
                        className="w-full border-2 border-dashed border-slate-200 rounded-xl py-3 text-sm text-slate-400 hover:border-brand-300 hover:text-brand-500 transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus size={16} /> Agregar pregunta personalizada
                      </button>
                    ) : (
                      <div className="space-y-3">
                        {customQuestions.map((q, idx) => (
                          <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                            <div className="flex items-start gap-2">
                              <span className="mt-2.5 text-xs font-semibold text-slate-400 shrink-0">{idx + 1}.</span>
                              <div className="flex-1 space-y-2 min-w-0">
                                <input
                                  type="text"
                                  value={q.text}
                                  onChange={(e) => updateCustomQuestion(idx, 'text', e.target.value)}
                                  placeholder="Pregunta (ej: ¿Ha intentado saltar o correr?)"
                                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white"
                                />
                                <input
                                  type="text"
                                  value={q.instruction_text}
                                  onChange={(e) => updateCustomQuestion(idx, 'instruction_text', e.target.value)}
                                  placeholder="Instrucción de ayuda (opcional)"
                                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeCustomQuestion(idx)}
                                className="mt-1.5 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                                aria-label="Quitar pregunta"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addCustomQuestion}
                          className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700"
                        >
                          <Plus size={14} /> Agregar otra pregunta
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>

            {/* Footer fijo */}
            <div className="flex gap-3 p-6 border-t border-slate-100 bg-white">
              <button
                type="button"
                onClick={() => setStep('search')}
                className="px-5 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
              >
                Volver
              </button>
              <button
                type="submit"
                disabled={!surgeryType || !surgeryDate || !frequencyValid}
                className="flex-1 px-4 py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-all shadow-lg shadow-brand-600/20"
              >
                Crear Seguimiento
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
