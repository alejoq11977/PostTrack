import { useState, useEffect } from 'react';
import { Users, Search, Plus, X, ChevronRight, Dog, Phone, Mail, Edit2 } from 'lucide-react';
import { vetService, VetOwner, VetPatient } from '@/features/vet/api/vet.service';

const PET_ICONS: Record<string, string> = {
  canine: '🐕',
  felin: '🐈',
  gato: '🐈',
  perro: '🐕',
  default: '🐾',
};

function getPetEmoji(species: string): string {
  const lower = species.toLowerCase();
  if (lower.includes('felin') || lower.includes('gato')) return PET_ICONS.felin;
  if (lower.includes('canin') || lower.includes('perro')) return PET_ICONS.canine;
  return PET_ICONS.default;
}

interface OwnerFormData {
  full_name: string;
  email: string;
  identification_number: string;
  phone_number: string;
  address: string;
}

interface PetFormData {
  name: string;
  species: string;
  breed: string;
  birth_date: string;
  current_weight: string;
}

const initialOwnerForm: OwnerFormData = {
  full_name: '',
  email: '',
  identification_number: '',
  phone_number: '',
  address: '',
};

const initialPetForm: PetFormData = {
  name: '',
  species: '',
  breed: '',
  birth_date: '',
  current_weight: '',
};

export const VetUsersPage = () => {
  const [owners, setOwners] = useState<VetOwner[]>([]);
  const [patients, setPatients] = useState<VetPatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchType, setSearchType] = useState<'owner' | 'patient'>('owner');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [ownerForm, setOwnerForm] = useState<OwnerFormData>(initialOwnerForm);
  const [petForm, setPetForm] = useState<PetFormData>(initialPetForm);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    document.title = 'Propietarios - PostTrack';
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const ownersData = await vetService.getOwners();
        setOwners(ownersData);
        if (searchType === 'patient' && search) {
          const patientsData = await vetService.searchPatients(search);
          setPatients(patientsData);
        } else {
          setPatients([]);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [searchType]);

  useEffect(() => {
    if (!search) {
      setPatients([]);
      return;
    }

    const timeout = setTimeout(async () => {
      if (searchType === 'patient') {
        try {
          const data = await vetService.searchPatients(search);
          setPatients(data);
        } catch (err) {
          console.error('Error searching patients:', err);
        }
      } else {
        const data = await vetService.getOwners(search);
        setOwners(data);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, searchType]);

  const handleOpenModal = () => {
    setOwnerForm(initialOwnerForm);
    setPetForm(initialPetForm);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!ownerForm.full_name || !ownerForm.email) return;

    setIsSaving(true);
    try {
      const owner = await vetService.createOwner(ownerForm);
      if (petForm.name && petForm.species) {
        console.log('Pet would be created for owner:', owner.id, petForm);
      }
      setShowModal(false);
      const ownersData = await vetService.getOwners();
      setOwners(ownersData);
    } catch (err) {
      console.error('Error saving owner:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-6">
        <h1 className="text-[24px] font-display font-semibold text-slate-800 tracking-tight">
          Propietarios
        </h1>
        <p className="text-slate-400 text-[13px] mt-1">
          Gestiona propietarios y sus mascotas
        </p>
      </div>

      {/* Search Toggle & Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => { setSearchType('owner'); setSearch(''); }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              searchType === 'owner'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Por propietario
          </button>
          <button
            onClick={() => { setSearchType('patient'); setSearch(''); }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              searchType === 'patient'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Por paciente
          </button>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={searchType === 'owner' ? "Buscar por nombre, email, cédula..." : "Buscar por nombre de mascota..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>

        <button
          onClick={handleOpenModal}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
        >
          <Plus size={18} />
          Crear usuario
        </button>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-white rounded-xl border border-slate-200 h-20" />
          ))}
        </div>
      ) : searchType === 'patient' && patients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {patients.map(patient => (
            <div
              key={patient.id}
              className="bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-2xl overflow-hidden">
                  {patient.photo_url ? (
                    <img src={patient.photo_url} alt={patient.name} className="w-full h-full object-cover" />
                  ) : (
                    getPetEmoji(patient.species)
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800">{patient.name}</h3>
                  <p className="text-sm text-slate-500">{patient.species} · {patient.breed}</p>
                  <p className="text-xs text-slate-400 mt-1">Dueño: {patient.owner_name}</p>
                </div>
                <ChevronRight size={20} className="text-slate-300 group-hover:text-brand-500" />
              </div>
            </div>
          ))}
        </div>
      ) : owners.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <Users size={48} className="text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No se encontraron propietarios</p>
        </div>
      ) : (
        <div className="space-y-3">
          {owners.map(owner => (
            <div
              key={owner.id}
              className="bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-lg">
                  {owner.full_name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-slate-800">{owner.full_name}</h3>
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {owner.patients_count} mascota{owner.patients_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">{owner.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {owner.phone_number && (
                    <a
                      href={`tel:${owner.phone_number}`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                    >
                      <Phone size={18} />
                    </a>
                  )}
                  <a
                    href={`mailto:${owner.email}`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                  >
                    <Mail size={18} />
                  </a>
                  <button
                    onClick={(e) => { e.stopPropagation(); }}
                    className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <ChevronRight size={20} className="text-slate-300 group-hover:text-brand-500" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Owner Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-slate-800">Crear propietario</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Datos del propietario</h3>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo *</label>
                  <input
                    type="text"
                    value={ownerForm.full_name}
                    onChange={(e) => setOwnerForm({ ...ownerForm, full_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Juan Pérez"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={ownerForm.email}
                    onChange={(e) => setOwnerForm({ ...ownerForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="juan@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Número de identificación</label>
                  <input
                    type="text"
                    value={ownerForm.identification_number}
                    onChange={(e) => setOwnerForm({ ...ownerForm, identification_number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="12345678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={ownerForm.phone_number}
                    onChange={(e) => setOwnerForm({ ...ownerForm, phone_number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="3001234567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
                  <input
                    type="text"
                    value={ownerForm.address}
                    onChange={(e) => setOwnerForm({ ...ownerForm, address: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Calle 123 #45-67"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Datos de la mascota (opcional)</h3>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={petForm.name}
                    onChange={(e) => setPetForm({ ...petForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Luna"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Especie</label>
                    <select
                      value={petForm.species}
                      onChange={(e) => setPetForm({ ...petForm, species: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="">Seleccionar</option>
                      <option value="Canino">Canino</option>
                      <option value="Felino">Felino</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Raza</label>
                    <input
                      type="text"
                      value={petForm.breed}
                      onChange={(e) => setPetForm({ ...petForm, breed: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="Labrador"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de nacimiento</label>
                    <input
                      type="date"
                      value={petForm.birth_date}
                      onChange={(e) => setPetForm({ ...petForm, birth_date: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Peso (kg)</label>
                    <input
                      type="number"
                      value={petForm.current_weight}
                      onChange={(e) => setPetForm({ ...petForm, current_weight: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="15.5"
                    />
                  </div>
                </div>

                <p className="text-xs text-slate-500">
                  La foto de la mascota es opcional pero recomendada para una identificación más rápida.
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-4 border-t bg-slate-50">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!ownerForm.full_name || !ownerForm.email || isSaving}
                className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};