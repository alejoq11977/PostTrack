import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Stethoscope, Clock, AlertTriangle, ChevronRight, Dog } from 'lucide-react';
import { vetService, VetMonitoring } from '@/features/vet/api/vet.service';

type SearchMode = 'owner' | 'patient';

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

interface SearchResult {
  id: number;
  type: 'owner' | 'patient';
  name: string;
  secondary?: string;
  phone?: string | null;
  photo_url?: string | null;
  species?: string;
  breed?: string;
}

function MonitoringCard({ monitoring }: { monitoring: VetMonitoring }) {
  return (
    <Link
      to={`/vet/reports?monitoring=${monitoring.id}`}
      className="block bg-white rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all duration-200"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
          <Stethoscope size={20} className="text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-medium text-slate-800">{monitoring.patient_name || 'Sin paciente'}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              monitoring.status === 'ACTIVE'
                ? 'bg-emerald-50 text-emerald-600'
                : monitoring.status === 'COMPLETED'
                ? 'bg-slate-100 text-slate-600'
                : 'bg-amber-50 text-amber-600'
            }`}>
              {monitoring.status || 'N/A'}
            </span>
          </div>
          <p className="text-slate-500 text-xs mb-1">
            {monitoring.owner_name || 'Sin propietario'}
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>{monitoring.surgery_type || 'N/A'}</span>
            {monitoring.surgery_date && (
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {formatDistanceToNow(monitoring.surgery_date)}
              </span>
            )}
            {monitoring.active_reports > 0 && (
              <span className="flex items-center gap-1 text-amber-600">
                <AlertTriangle size={12} />
                {monitoring.active_reports} pendiente(s)
              </span>
            )}
          </div>
        </div>
        <ChevronRight size={18} className="text-slate-300" />
      </div>
    </Link>
  );
}

export const VetMonitoringsPage = () => {
  const [searchMode, setSearchMode] = useState<SearchMode>('owner');
  const [searchQuery, setSearchQuery] = useState('');
  const [monitorings, setMonitorings] = useState<VetMonitoring[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

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
    } catch (error) {
      console.error('Error loading monitorings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      loadMonitorings();
      return;
    }
    setLoading(true);
    try {
      if (searchMode === 'owner') {
        const owners = await vetService.searchOwners(query);
        console.log('Owners:', owners);
      } else {
        const patients = await vetService.searchPatients(query);
        console.log('Patients:', patients);
      }
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMonitoring = async (patientId: number, surgeryType: string, surgeryDate: string, frequency: number) => {
    try {
      await vetService.createMonitoring({
        patient_id: patientId,
        surgery_type: surgeryType,
        surgery_date: surgeryDate,
        report_frequency_hours: frequency,
        status: 'ACTIVE',
      });
      setShowCreateModal(false);
      loadMonitorings();
    } catch (error) {
      console.error('Error creating monitoring:', error);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-display font-semibold text-slate-800 tracking-tight">
            Seguimientos
          </h1>
          <p className="text-slate-400 text-[13px] mt-1">
            Crea y gestiona seguimientos quirúrgicos
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Nuevo Seguimiento
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setSearchMode('owner')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                searchMode === 'owner'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Por Propietario
            </button>
            <button
              onClick={() => setSearchMode('patient')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
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
              placeholder={searchMode === 'owner' ? 'Buscar por nombre de propietario...' : 'Buscar por nombre de paciente...'}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
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
          {monitorings.map((monitoring) => (
            <MonitoringCard key={monitoring.id} monitoring={monitoring} />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateMonitoringModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateMonitoring}
        />
      )}
    </div>
  );
};

function CreateMonitoringModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (patientId: number, surgeryType: string, surgeryDate: string, frequency: number) => void;
}) {
  const [searchMode, setSearchMode] = useState<SearchMode>('owner');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<{ id: number; name: string } | null>(null);
  const [surgeryType, setSurgeryType] = useState('');
  const [surgeryDate, setSurgeryDate] = useState('');
  const [frequency, setFrequency] = useState(24);
  const [step, setStep] = useState<'search' | 'details'>('search');

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      if (searchMode === 'owner') {
        const owners = await vetService.searchOwners(query);
        setSearchResults(owners.map((o: { id: number; full_name: string; patients_count: number; phone_number: string | null }) => ({
          id: o.id,
          type: 'owner' as const,
          name: o.full_name,
          secondary: `${o.patients_count} pacientes`,
          phone: o.phone_number,
        })));
      } else {
        const patients = await vetService.searchPatients(query);
        setSearchResults(patients.map((p) => ({
          id: p.id,
          type: 'patient' as const,
          name: p.name,
          secondary: p.owner_name || '',
          phone: p.owner_phone || null,
          photo_url: p.photo_url,
          species: p.species,
          breed: p.breed,
        })));
      }
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  const handleSelectPatient = (result: SearchResult) => {
    if (result.type === 'owner') {
      vetService.searchPatients(result.name).then(patients => {
        if (patients.length > 0) {
          setSelectedPatient({ id: patients[0].id, name: patients[0].name });
          setStep('details');
        }
      });
    } else {
      setSelectedPatient({ id: result.id, name: result.name });
      setStep('details');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPatient && surgeryType && surgeryDate) {
      onCreate(selectedPatient.id, surgeryType, surgeryDate, frequency);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800">Nuevo Seguimiento</h2>
          <p className="text-slate-400 text-sm mt-1">
            {step === 'search' ? 'Busca y selecciona un paciente' : 'Completa los datos del seguimiento'}
          </p>
        </div>

        {step === 'search' ? (
          <div className="p-6">
            <div className="flex gap-2 p-1 bg-slate-100 rounded-lg mb-4">
              <button
                onClick={() => setSearchMode('owner')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  searchMode === 'owner' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                }`}
              >
                Por Propietario
              </button>
              <button
                onClick={() => setSearchMode('patient')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  searchMode === 'patient' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                }`}
              >
                Por Paciente
              </button>
            </div>

            <div className="relative mb-4">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={searchMode === 'owner' ? 'Nombre del propietario...' : 'Nombre del paciente...'}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {searchResults.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelectPatient(result)}
                  className="w-full p-3 bg-slate-50 hover:bg-blue-50 rounded-lg text-left transition-colors"
                >
                  {result.type === 'patient' && result.photo_url ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={result.photo_url}
                        alt={result.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium text-slate-800">{result.name}</p>
                        <p className="text-xs text-slate-500">{result.species} · {result.breed}</p>
                        {result.secondary && (
                          <p className="text-xs text-slate-400 mt-0.5">Dueño: {result.secondary}</p>
                        )}
                      </div>
                    </div>
                  ) : result.type === 'patient' ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Dog size={20} className="text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{result.name}</p>
                        <p className="text-xs text-slate-500">{result.species || 'Mascota'} · {result.breed || ''}</p>
                        {result.secondary && (
                          <p className="text-xs text-slate-400 mt-0.5">Dueño: {result.secondary}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="font-medium text-slate-800">{result.name}</p>
                      {result.secondary && (
                        <p className="text-xs text-slate-500">{result.secondary}</p>
                      )}
                    </>
                  )}
                </button>
              ))}
              {searchQuery && searchResults.length === 0 && (
                <p className="text-center text-slate-400 py-4">No se encontraron resultados</p>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-slate-600">Paciente seleccionado:</p>
              <p className="font-medium text-slate-800">{selectedPatient?.name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de cirugía</label>
              <input
                type="text"
                value={surgeryType}
                onChange={(e) => setSurgeryType(e.target.value)}
                placeholder="Ej: Esterilización, Castración..."
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de cirugía</label>
              <input
                type="date"
                value={surgeryDate}
                onChange={(e) => setSurgeryDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Frecuencia de reportes (horas)</label>
              <input
                type="number"
                value={frequency}
                onChange={(e) => setFrequency(parseInt(e.target.value) || 24)}
                min="1"
                max="168"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep('search')}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Volver
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Crear Seguimiento
              </button>
            </div>
          </form>
        )}

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}