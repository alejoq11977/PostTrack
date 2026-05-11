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
  owner_id?: number;
  owner_email?: string;
  owner_identification_number?: string;
}

function MonitoringCard({ monitoring }: { monitoring: VetMonitoring }) {
  return (
    <Link
      to={`/vet/reports?monitoring=${monitoring.id}`}
      className="block bg-white rounded-2xl border border-slate-200 p-5 hover:border-brand-300 hover:shadow-lg transition-all duration-200"
    >
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
          <Stethoscope size={22} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-800 text-lg leading-tight">{monitoring.patient_name || 'Sin paciente'}</h3>
              <p className="text-sm text-brand-600 font-medium mt-0.5">{monitoring.surgery_type || 'N/A'}</p>
            </div>
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full shrink-0 ${
              monitoring.status === 'ACTIVE'
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : monitoring.status === 'COMPLETED'
                ? 'bg-slate-100 text-slate-600 border border-slate-200'
                : 'bg-amber-50 text-amber-600 border border-amber-200'
            }`}>
              {monitoring.status || 'N/A'}
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
          <div className="flex items-center gap-4 text-xs mt-3">
            {monitoring.surgery_date && (
              <span className="flex items-center gap-1.5 text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full">
                <Clock size={12} />
                {formatDistanceToNow(monitoring.surgery_date)}
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
        <ChevronRight size={20} className="text-slate-300 mt-2" />
      </div>
    </Link>
  );
}

export const VetMonitoringsPage = () => {
  const [searchMode, setSearchMode] = useState<SearchMode>('owner');
  const [searchQuery, setSearchQuery] = useState('');
  const [monitorings, setMonitorings] = useState<VetMonitoring[]>([]);
  const [filteredMonitorings, setFilteredMonitorings] = useState<VetMonitoring[]>([]);
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
      setFilteredMonitorings(data);
    } catch (error) {
      console.error('Error loading monitorings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonitorings();
  }, []);

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
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/20 hover:shadow-brand-600/30 font-medium text-sm"
        >
          <Plus size={18} />
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
  const [selectedPatient, setSelectedPatient] = useState<{ id: number; name: string; owner_name?: string } | null>(null);
  const [surgeryType, setSurgeryType] = useState('');
  const [surgeryDate, setSurgeryDate] = useState('');
  const [frequency, setFrequency] = useState(24);
  const [step, setStep] = useState<'search' | 'details'>('search');
  const [isSearching, setIsSearching] = useState(false);

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
    if (selectedPatient && surgeryType && surgeryDate) {
      onCreate(selectedPatient.id, surgeryType, surgeryDate, frequency);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
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
          <div className="p-6">
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
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="p-4 bg-gradient-to-br from-brand-50 to-slate-50 border border-brand-100 rounded-xl">
              <p className="text-xs font-medium text-brand-600 uppercase tracking-wider mb-1">Paciente seleccionado</p>
              <p className="font-semibold text-slate-800 text-lg">{selectedPatient?.name}</p>
              {selectedPatient?.owner_name && (
                <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                  <span>👤</span> {selectedPatient.owner_name}
                </p>
              )}
            </div>

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

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Fecha de cirugía *</label>
              <input
                type="date"
                value={surgeryDate}
                onChange={(e) => setSurgeryDate(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-slate-50/50"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Frecuencia de reportes (horas)</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(parseInt(e.target.value) || 24)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-slate-50/50"
              >
                <option value={12}>Cada 12 horas</option>
                <option value={24}>Cada 24 horas</option>
                <option value={48}>Cada 48 horas</option>
                <option value={72}>Cada 72 horas</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep('search')}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
              >
                Volver
              </button>
              <button
                type="submit"
                disabled={!surgeryType || !surgeryDate}
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