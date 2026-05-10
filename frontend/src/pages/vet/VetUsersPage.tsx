import { useState, useEffect, useRef } from 'react';
import { Users, Search, Plus, X, ChevronRight, Dog, Edit2, Upload, Trash2 } from 'lucide-react';
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
  password: string;
  confirm_password: string;
  identification_number: string;
  phone_number: string;
  address: string;
}

interface PetFormData {
  id: string;
  name: string;
  species: string;
  breed: string;
  birth_date: string;
  current_weight: string;
  photo_url: string;
  photo_file: File | null;
}

const createEmptyPet = (): PetFormData => ({
  id: crypto.randomUUID(),
  name: '',
  species: '',
  breed: '',
  birth_date: '',
  current_weight: '',
  photo_url: '',
  photo_file: null,
});

const initialOwnerForm: OwnerFormData = {
  full_name: '',
  email: '',
  password: '',
  confirm_password: '',
  identification_number: '',
  phone_number: '',
  address: '',
};

export const VetUsersPage = () => {
  const [owners, setOwners] = useState<VetOwner[]>([]);
  const [patients, setPatients] = useState<VetPatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchType, setSearchType] = useState<'owner' | 'patient'>('owner');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingOwnerId, setEditingOwnerId] = useState<number | null>(null);
  const [ownerForm, setOwnerForm] = useState<OwnerFormData>(initialOwnerForm);
  const [pets, setPets] = useState<PetFormData[]>([]);
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

  const handleOpenModal = (owner?: VetOwner) => {
    if (owner) {
      setIsEditing(true);
      setEditingOwnerId(owner.id);
      setOwnerForm({
        full_name: owner.full_name,
        email: owner.email,
        password: '',
        confirm_password: '',
        identification_number: owner.identification_number || '',
        phone_number: owner.phone_number || '',
        address: owner.address || '',
      });
    } else {
      setIsEditing(false);
      setEditingOwnerId(null);
      setOwnerForm(initialOwnerForm);
    }
    setPets([]);
    setShowModal(true);
  };

  const handleAddPet = () => {
    setPets([...pets, createEmptyPet()]);
  };

  const handleRemovePet = (id: string) => {
    setPets(pets.filter(p => p.id !== id));
  };

  const handlePetChange = (id: string, field: keyof PetFormData, value: string | File | null) => {
    setPets(pets.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const uploadPetPhoto = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch('https://api.imgbb.com/1/upload?key=YOUR_IMGBB_API_KEY', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      return data.data?.url || null;
    } catch (err) {
      console.error('Error uploading photo:', err);
      return null;
    }
  };

  const handleSave = async () => {
    if (!ownerForm.full_name || !ownerForm.email) return;

    if (!isEditing && (!ownerForm.password || !ownerForm.confirm_password)) {
      alert('La contraseña es obligatoria para nuevos propietarios');
      return;
    }

    if (ownerForm.password && ownerForm.password !== ownerForm.confirm_password) {
      alert('Las contraseñas no coinciden');
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing && editingOwnerId) {
        await vetService.updateOwner(editingOwnerId, {
          full_name: ownerForm.full_name,
          email: ownerForm.email,
          identification_number: ownerForm.identification_number,
          phone_number: ownerForm.phone_number,
          address: ownerForm.address,
        });

        for (const pet of pets) {
          if (pet.name && pet.species) {
            let photoUrl = pet.photo_url;
            if (pet.photo_file) {
              const uploaded = await uploadPetPhoto(pet.photo_file);
              if (uploaded) photoUrl = uploaded;
            }
            await vetService.createPatient({
              owner_id: editingOwnerId,
              name: pet.name,
              species: pet.species,
              breed: pet.breed,
              birth_date: pet.birth_date,
              current_weight: parseFloat(pet.current_weight) || 0,
              photo_url: photoUrl,
            });
          }
        }
      } else {
        const owner = await vetService.createOwner({
          full_name: ownerForm.full_name,
          email: ownerForm.email,
          password: ownerForm.password,
          confirm_password: ownerForm.confirm_password,
          identification_number: ownerForm.identification_number,
          phone_number: ownerForm.phone_number,
          address: ownerForm.address,
        });

        for (const pet of pets) {
          if (pet.name && pet.species) {
            let photoUrl = pet.photo_url;
            if (pet.photo_file) {
              const uploaded = await uploadPetPhoto(pet.photo_file);
              if (uploaded) photoUrl = uploaded;
            }
            await vetService.createPatient({
              owner_id: owner.id,
              name: pet.name,
              species: pet.species,
              breed: pet.breed,
              birth_date: pet.birth_date,
              current_weight: parseFloat(pet.current_weight) || 0,
              photo_url: photoUrl,
            });
          }
        }
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
                  <button
                    onClick={(e) => { e.stopPropagation(); handleOpenModal(owner); }}
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-slate-800">{isEditing ? 'Editar propietario' : 'Crear propietario'}</h2>
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

                {!isEditing && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña *</label>
                      <input
                        type="password"
                        value={ownerForm.password}
                        onChange={(e) => setOwnerForm({ ...ownerForm, password: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                        placeholder="Mínimo 8 caracteres"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar contraseña *</label>
                      <input
                        type="password"
                        value={ownerForm.confirm_password}
                        onChange={(e) => setOwnerForm({ ...ownerForm, confirm_password: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                        placeholder="Repite la contraseña"
                      />
                    </div>
                  </>
                )}

                {isEditing && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-700">Para cambiar la contraseña, completa estos campos. De lo contrario, déjalos vacíos.</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-amber-700 mb-1">Nueva contraseña</label>
                        <input
                          type="password"
                          value={ownerForm.password}
                          onChange={(e) => setOwnerForm({ ...ownerForm, password: e.target.value })}
                          className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                          placeholder="Nueva contraseña"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-amber-700 mb-1">Confirmar</label>
                        <input
                          type="password"
                          value={ownerForm.confirm_password}
                          onChange={(e) => setOwnerForm({ ...ownerForm, confirm_password: e.target.value })}
                          className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                          placeholder="Repite la contraseña"
                        />
                      </div>
                    </div>
                  </div>
                )}

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

              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Mascotas</h3>
                  <button
                    type="button"
                    onClick={handleAddPet}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                  >
                    <Plus size={16} />
                    Añadir mascota
                  </button>
                </div>

                {pets.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">
                    No hay mascotas añadidas. Haz clic en "Añadir mascota" para agregar una.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {pets.map((pet, index) => (
                      <PetFormCard
                        key={pet.id}
                        pet={pet}
                        index={index}
                        onChange={(field, value) => handlePetChange(pet.id, field, value)}
                        onRemove={() => handleRemovePet(pet.id)}
                        canRemove={pets.length > 1}
                      />
                    ))}
                  </div>
                )}
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
                disabled={!ownerForm.full_name || !ownerForm.email || !ownerForm.password || isSaving}
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

interface PetFormCardProps {
  pet: PetFormData;
  index: number;
  onChange: (field: keyof PetFormData, value: string | File | null) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function PetFormCard({ pet, index, onChange, onRemove, canRemove }: PetFormCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);

  return (
    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-600">Mascota {index + 1}</span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Nombre *</label>
          <input
            type="text"
            value={pet.name}
            onChange={(e) => onChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Luna"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Especie *</label>
          <select
            value={pet.species}
            onChange={(e) => onChange('species', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Seleccionar</option>
            <option value="Canino">Canino</option>
            <option value="Felino">Felino</option>
            <option value="Ave">Ave</option>
            <option value="Reptil">Reptil</option>
            <option value="Roedor">Roedor</option>
            <option value="Otro">Otro</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Raza</label>
          <input
            type="text"
            value={pet.breed}
            onChange={(e) => onChange('breed', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Labrador"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Fecha de nacimiento</label>
          <input
            type="date"
            value={pet.birth_date}
            onChange={(e) => onChange('birth_date', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Peso (kg)</label>
          <input
            type="number"
            value={pet.current_weight}
            onChange={(e) => onChange('current_weight', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="15.5"
            step="0.1"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">Foto</label>
          <div className="flex items-center gap-2">
            {pet.photo_url ? (
              <div className="relative">
                <img src={pet.photo_url} alt={pet.name} className="w-16 h-16 rounded-lg object-cover border border-slate-200" />
                <button
                  type="button"
                  onClick={() => onChange('photo_url', '')}
                  className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-500 rounded-full"
                >
                  <X size={12} />
                </button>
              </div>
            ) : pet.photo_file ? (
              <div className="relative">
                <img src={URL.createObjectURL(pet.photo_file)} alt={pet.name} className="w-16 h-16 rounded-lg object-cover border border-slate-200" />
                <button
                  type="button"
                  onClick={() => onChange('photo_file', null)}
                  className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-500 rounded-full"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowPhotoUpload(!showPhotoUpload)}
                className="flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-brand-500 hover:text-brand-500 transition-colors"
              >
                <Upload size={16} />
                Subir foto
              </button>
            )}
          </div>
          {showPhotoUpload && !pet.photo_url && !pet.photo_file && (
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onChange('photo_file', file);
              }}
              className="mt-2 text-sm"
            />
          )}
        </div>
      </div>
    </div>
  );
}
