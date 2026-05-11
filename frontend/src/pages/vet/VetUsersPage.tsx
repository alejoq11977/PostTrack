import { useState, useEffect, useRef } from 'react';
import { Users, Search, Plus, X, ChevronRight, Dog, Edit2, Trash2, Camera, UserPlus } from 'lucide-react';
import { vetService, VetOwner, VetPatient } from '@/features/vet/api/vet.service';

interface OwnerFormData {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
  identification_type: string;
  identification_number: string;
  phone_number: string;
  address: string;
}

interface PetFormData {
  id: string;
  dbId: number | null;
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
  dbId: null,
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
  identification_type: '',
  identification_number: '',
  phone_number: '',
  address: '',
};

const DOCUMENT_TYPES = [
  { value: 'CC', label: 'Cédula de Ciudadanía (CC)' },
  { value: 'CE', label: 'Cédula de Extranjería (CE)' },
  { value: 'PA', label: 'Pasaporte (PA)' },
  { value: 'PEP', label: 'Permiso Especial (PEP)' },
];

const COMMON_EMAIL_DOMAINS: Record<string, string[]> = {
  'gmail.com': ['gmail.coom', 'gmail.cm', 'gmailc.om', 'gmal.com', 'gmail.con', 'gmail.comm', 'gmil.com', 'gnail.com'],
  'yahoo.com': ['yahoo.coom', 'yahoo.cm', 'yahoo.con', 'yaho.com', 'yahooo.com'],
  'hotmail.com': ['hotmail.coom', 'hotmail.cm', 'hotmail.con', 'hotmal.com', 'hotmil.com'],
  'outlook.com': ['outlook.coom', 'outlook.cm', 'outlook.con', 'outlok.com', 'outllok.com'],
  'icloud.com': ['icloud.coom', 'icloud.cm', 'iclould.com', 'icold.com'],
};

const getEmailTypoWarning = (email: string): string | null => {
  if (!email || !email.includes('@')) return null;
  const [, domain] = email.split('@');
  if (!domain) return null;
  const domainLower = domain.toLowerCase();
  for (const [correct, typos] of Object.entries(COMMON_EMAIL_DOMAINS)) {
    if (typos.includes(domainLower)) {
      return `¿Quisiste decir ${correct}?`;
    }
  }
  return null;
};

const getPasswordErrors = (pwd: string): string[] => {
  if (!pwd) return [];
  const errors = [];
  if (pwd.length > 0 && pwd.length < 8) errors.push('Mínimo 8 caracteres');
  if (pwd.length > 0 && !/\d/.test(pwd)) errors.push('Al menos un número');
  if (pwd.length > 0 && !/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) errors.push('Al menos un carácter especial (!@#$%^&*)');
  return errors;
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

  const isViewMode = editingOwnerId !== null && !isEditing;
  const passwordErrors = getPasswordErrors(ownerForm.password);
  const emailTypoWarning = getEmailTypoWarning(ownerForm.email);

  useEffect(() => {
    document.title = 'Propietarios - PostTrack';
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const ownersData = await vetService.getOwners();
        setOwners(ownersData);
        if (searchType === 'patient') {
          const patientsData = await vetService.searchPatients(search || '');
          setPatients(patientsData);
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
    const timeout = setTimeout(async () => {
      if (searchType === 'patient') {
        try {
          const data = await vetService.searchPatients(search);
          setPatients(data);
        } catch (err) {
          console.error('Error searching patients:', err);
        }
      } else if (search) {
        const data = await vetService.getOwners(search);
        setOwners(data);
      } else {
        const data = await vetService.getOwners();
        setOwners(data);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, searchType]);

  const handleViewOwner = (owner: VetOwner) => {
    setIsEditing(false);
    setEditingOwnerId(owner.id);
    setOwnerForm({
      full_name: owner.full_name,
      email: owner.email,
      password: '',
      confirm_password: '',
      identification_type: owner.identification_type || '',
      identification_number: owner.identification_number || '',
      phone_number: owner.phone_number || '',
      address: owner.address || '',
    });
    if (owner.patients && owner.patients.length > 0) {
      setPets(owner.patients.map(p => ({
        id: crypto.randomUUID(),
        dbId: p.id,
        name: p.name,
        species: p.species,
        breed: p.breed,
        birth_date: p.birth_date || '',
        current_weight: p.current_weight?.toString() || '',
        photo_url: p.photo_url || '',
        photo_file: null,
      })));
    } else {
      setPets([]);
    }
    setShowModal(true);
  };

  const handleOpenModal = (owner?: VetOwner) => {
    if (owner) {
      setIsEditing(false);
      setEditingOwnerId(owner.id);
      setOwnerForm({
        full_name: owner.full_name,
        email: owner.email,
        password: '',
        confirm_password: '',
        identification_type: owner.identification_type || '',
        identification_number: owner.identification_number || '',
        phone_number: owner.phone_number || '',
        address: owner.address || '',
      });
      if (owner.patients && owner.patients.length > 0) {
        setPets(owner.patients.map(p => ({
          id: crypto.randomUUID(),
          dbId: p.id,
          name: p.name,
          species: p.species,
          breed: p.breed,
          birth_date: p.birth_date || '',
          current_weight: p.current_weight?.toString() || '',
          photo_url: p.photo_url || '',
          photo_file: null,
        })));
      } else {
        setPets([]);
      }
    } else {
      setIsEditing(false);
      setEditingOwnerId(null);
      setOwnerForm(initialOwnerForm);
      setPets([createEmptyPet()]);
    }
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
    formData.append('image', file);
    formData.append('name', file.name);
    try {
      const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
      if (!apiKey) {
        console.error('IMGBB API key not configured');
        return null;
      }
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        console.error('ImgBB upload failed:', data);
        return null;
      }
      return data.data?.url || null;
    } catch (err) {
      console.error('Error uploading photo:', err);
      return null;
    }
  };

  const handleSave = async () => {
    if (!ownerForm.full_name || !ownerForm.email) {
      alert('Complete todos los campos obligatorios');
      return;
    }

    const typoWarning = getEmailTypoWarning(ownerForm.email);
    if (typoWarning && !window.confirm(`El email "${ownerForm.email}" parece tener un error. ¿Estás seguro de que es correcto?`)) {
      return;
    }

    if (!ownerForm.identification_type || !ownerForm.identification_number) {
      alert('Seleccione el tipo de documento e ingrese el número de identificación');
      return;
    }

    if (passwordErrors.length > 0) {
      alert('La contraseña no cumple con los requisitos:\n' + passwordErrors.join('\n'));
      return;
    }

    if (ownerForm.password && ownerForm.password !== ownerForm.confirm_password) {
      alert('Las contraseñas no coinciden');
      return;
    }

    if (!editingOwnerId && pets.length === 0) {
      alert('Debes añadir al menos una mascota al crear un nuevo propietario');
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
          if (pet.dbId !== null && pet.name && pet.species) {
            let photoUrl = pet.photo_url;
            if (pet.photo_file) {
              const uploaded = await uploadPetPhoto(pet.photo_file);
              if (uploaded) photoUrl = uploaded;
            }
            await vetService.updatePatient(pet.dbId, {
              name: pet.name,
              species: pet.species,
              breed: pet.breed,
              birth_date: pet.birth_date,
              current_weight: parseFloat(pet.current_weight) || 0,
              photo_url: photoUrl,
            });
          } else if (pet.dbId === null && pet.name && pet.species) {
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
          identification_type: ownerForm.identification_type,
          password: ownerForm.password || '',
          confirm_password: ownerForm.confirm_password || '',
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

      const ownersData = await vetService.getOwners();
      setOwners(ownersData);

      if (searchType === 'patient') {
        if (search) {
          const patientsData = await vetService.searchPatients(search);
          setPatients(patientsData);
        } else {
          const patientsData = await vetService.searchPatients('');
          setPatients(patientsData);
        }
      }

      if (editingOwnerId) {
        const updatedOwner = ownersData.find((o: VetOwner) => o.id === editingOwnerId);
        if (updatedOwner) {
          setOwnerForm({
            full_name: updatedOwner.full_name,
            email: updatedOwner.email,
            password: '',
            confirm_password: '',
            identification_type: updatedOwner.identification_type || '',
            identification_number: updatedOwner.identification_number || '',
            phone_number: updatedOwner.phone_number || '',
            address: updatedOwner.address || '',
          });
          if (updatedOwner.patients && updatedOwner.patients.length > 0) {
            setPets(updatedOwner.patients.map((p: VetPatient) => ({
              id: crypto.randomUUID(),
              dbId: p.id,
              name: p.name,
              species: p.species,
              breed: p.breed,
              birth_date: p.birth_date || '',
              current_weight: p.current_weight?.toString() || '',
              photo_url: p.photo_url || '',
              photo_file: null,
            })));
          }
          setIsEditing(false);
        }
        setShowModal(false);
      } else {
        setShowModal(false);
      }
    } catch (err: any) {
      console.error('Error saving owner:', err);
      const errors = err?.response?.data;
      let errorMsg = 'Error al guardar';
      if (errors) {
        const messages = Object.values(errors).flat().join('\n');
        if (messages) errorMsg = messages;
      }
      alert(errorMsg);
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
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => { setSearchType('owner'); setSearch(''); }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              searchType === 'owner'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Por propietario
          </button>
          <button
            onClick={() => { setSearchType('patient'); setSearch(''); }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
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
            placeholder={searchType === 'owner' ? "Buscar por nombre, email, número de identificación..." : "Buscar por nombre de mascota..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white"
          />
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/20 hover:shadow-brand-600/30"
        >
          <UserPlus size={18} />
          Crear usuario
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-white rounded-2xl border border-slate-200 h-24" />
          ))}
        </div>
      ) : searchType === 'patient' && patients.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {patients.map(patient => {
            const owner = owners.find(o => o.id === patient.owner_id);
            const isCat = patient.species.toLowerCase().includes('felin') || patient.species.toLowerCase().includes('gat');
            return (
              <div
                key={patient.id}
                onClick={() => {
                  if (owner) handleOpenModal(owner);
                }}
                className="group bg-white rounded-xl border border-slate-200 overflow-hidden cursor-pointer hover:border-slate-300 hover:shadow-md transition-all duration-200"
              >
                <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                  {patient.photo_url ? (
                    <img
                      src={patient.photo_url}
                      alt={patient.name}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                      <span className="text-7xl opacity-40 select-none">
                        {isCat ? '🐈' : '🐕'}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
                  <div className="absolute bottom-0 inset-x-0 px-4 pb-3">
                    <h3 className="text-white text-[18px] font-semibold tracking-tight drop-shadow-sm mb-0.5">
                      {patient.name}
                    </h3>
                    {owner && (
                      <p className="text-white/75 text-xs drop-shadow-sm">
                        {owner.full_name}
                      </p>
                    )}
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-[11px] font-medium">
                      {isCat ? '🐱' : '🐶'}
                    </span>
                  </div>
                </div>
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[13px] text-slate-700 font-medium">{patient.breed || 'Sin raza'}</p>
                    {patient.current_weight > 0 && (
                      <span className="text-[11px] text-slate-400 font-medium">
                        {patient.current_weight} kg
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-slate-400 font-medium">{patient.species}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : owners.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={36} className="text-slate-300" />
          </div>
          <p className="text-slate-600 font-medium">No se encontraron propietarios</p>
          <p className="text-slate-400 text-sm mt-1">Crea un nuevo usuario para comenzar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {owners.map(owner => (
            <div
              key={owner.id}
              onClick={() => handleViewOwner(owner)}
              className="bg-white rounded-2xl border border-slate-200 p-5 cursor-pointer hover:shadow-lg hover:border-brand-200 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {owner.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-slate-800 text-lg">{owner.full_name}</h3>
                    <span className="text-xs text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full font-medium">
                      {owner.patients_count} mascota{owner.patients_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">{owner.email}</p>
                  {owner.identification_number && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {owner.identification_type} {owner.identification_number}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <ChevronRight size={20} className="text-slate-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">
                  {!editingOwnerId ? 'Nuevo propietario' : isEditing ? 'Editar propietario' : 'Ver propietario'}
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  {!editingOwnerId ? 'Completa los datos para crear un nuevo propietario' : isEditing ? 'Actualiza los datos del propietario' : 'Información del propietario'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {editingOwnerId && !isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-all font-medium"
                  >
                    <Edit2 size={16} />
                    Editar
                  </button>
                )}
                <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 max-h-[calc(90vh-180px)] overflow-y-auto">
              <div className="space-y-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
                    <Users size={16} className="text-brand-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Datos del propietario</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Nombre completo *</label>
                    <input
                      type="text"
                      value={ownerForm.full_name}
                      onChange={(e) => setOwnerForm({ ...ownerForm, full_name: e.target.value })}
                      disabled={isViewMode}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-slate-50/50 transition-all disabled:bg-slate-100 disabled:text-slate-600"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Correo electrónico *</label>
                    <input
                      type="email"
                      value={ownerForm.email}
                      onChange={(e) => setOwnerForm({ ...ownerForm, email: e.target.value })}
                      disabled={isViewMode}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-slate-50/50 transition-all disabled:bg-slate-100 disabled:text-slate-600"
                    />
                    {emailTypoWarning && (
                      <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                        <span>⚠️</span> {emailTypoWarning}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Tipo de Documento *</label>
                    <select
                      value={ownerForm.identification_type}
                      onChange={(e) => setOwnerForm({ ...ownerForm, identification_type: e.target.value })}
                      disabled={isViewMode}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-slate-50/50 transition-all disabled:bg-slate-100 disabled:text-slate-600"
                    >
                      <option value="">Seleccionar</option>
                      {DOCUMENT_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Número de Identificación *</label>
                    <input
                      type="text"
                      value={ownerForm.identification_number}
                      onChange={(e) => setOwnerForm({ ...ownerForm, identification_number: e.target.value })}
                      disabled={isViewMode}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-slate-50/50 transition-all disabled:bg-slate-100 disabled:text-slate-600"
                    />
                  </div>

                  {!editingOwnerId && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Contraseña</label>
                        <input
                          type="password"
                          value={ownerForm.password}
                          onChange={(e) => setOwnerForm({ ...ownerForm, password: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-slate-50/50 transition-all"
                        />
                        <p className="text-xs text-slate-400 mt-1">
                          Si se deja vacía, la contraseña será ".{ownerForm.identification_number || '12345678'}@"
                        </p>
                        {passwordErrors.length > 0 && (
                          <div className="mt-1.5 space-y-0.5">
                            {passwordErrors.map((err, i) => (
                              <p key={i} className="text-xs text-red-600 flex items-center gap-1">
                                <span>●</span> {err}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Confirmar Contraseña</label>
                        <input
                          type="password"
                          value={ownerForm.confirm_password}
                          onChange={(e) => setOwnerForm({ ...ownerForm, confirm_password: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-slate-50/50 transition-all"
                        />
                        {ownerForm.confirm_password && ownerForm.password !== ownerForm.confirm_password && (
                          <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                            <span>●</span> Las contraseñas no coinciden
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  {isEditing && ownerForm.password && (
                    <div className="col-span-2 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-sm text-amber-700 font-medium">Cambiar contraseña</p>
                      <div className="mt-2 grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-amber-700 mb-1">Nueva contraseña</label>
                          <input
                            type="password"
                            value={ownerForm.password}
                            onChange={(e) => setOwnerForm({ ...ownerForm, password: e.target.value })}
                            className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                          {passwordErrors.length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              {passwordErrors.map((err, i) => (
                                <p key={i} className="text-xs text-red-600 flex items-center gap-1">
                                  <span>●</span> {err}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-amber-700 mb-1">Confirmar</label>
                          <input
                            type="password"
                            value={ownerForm.confirm_password}
                            onChange={(e) => setOwnerForm({ ...ownerForm, confirm_password: e.target.value })}
                            className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Teléfono</label>
                    <input
                      type="tel"
                      value={ownerForm.phone_number}
                      onChange={(e) => setOwnerForm({ ...ownerForm, phone_number: e.target.value })}
                      disabled={isViewMode}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-slate-50/50 transition-all disabled:bg-slate-100 disabled:text-slate-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Dirección</label>
                    <input
                      type="text"
                      value={ownerForm.address}
                      onChange={(e) => setOwnerForm({ ...ownerForm, address: e.target.value })}
                      disabled={isViewMode}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-slate-50/50 transition-all disabled:bg-slate-100 disabled:text-slate-600"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Dog size={16} className="text-emerald-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Mascotas</h3>
                  </div>
                  {isEditing || editingOwnerId === null ? (
                    <button
                      type="button"
                      onClick={handleAddPet}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 transition-all font-medium"
                    >
                      <Plus size={16} />
                      Añadir mascota
                    </button>
                  ) : null}
                </div>

                {pets.length === 0 ? (
                  <div className="text-center py-10 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/30">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Dog size={24} className="text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-500">No hay mascotas añadidas</p>
                    <p className="text-xs text-slate-400 mt-1">Haz clic en "Añadir mascota" para agregar una</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pets.map((pet, index) => (
                      <PetFormCard
                        key={pet.id}
                        pet={pet}
                        index={index}
                        onChange={(field, value) => handlePetChange(pet.id, field, value)}
                        onRemove={() => handleRemovePet(pet.id)}
                        canRemove={pets.length > 1 && isEditing}
                        disabled={isViewMode}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={() => {
                  if (isEditing && editingOwnerId !== null) {
                    setIsEditing(false);
                  } else {
                    setShowModal(false);
                  }
                }}
                className="flex-1 px-4 py-3 text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-medium"
              >
                {isEditing ? 'Cancelar' : 'Cerrar'}
              </button>
              {isEditing || editingOwnerId === null ? (
                <button
                  onClick={handleSave}
                  disabled={!ownerForm.full_name || !ownerForm.email || isSaving}
                  className="flex-1 px-4 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-all font-medium shadow-lg shadow-brand-600/20"
                >
                  {isSaving ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Guardando...
                    </span>
                  ) : editingOwnerId ? 'Actualizar' : 'Crear'}
                </button>
              ) : null}
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
  disabled?: boolean;
}

function PetFormCard({ pet, index, onChange, onRemove, canRemove, disabled = false }: PetFormCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onChange('photo_file', file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange('photo_file', file);
    }
  };

  return (
    <div className="p-5 bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 text-sm font-bold">
            {index + 1}
          </div>
          <span className="text-sm font-medium text-slate-600">Mascota {index + 1}</span>
        </div>
        <div className="flex items-center gap-2">
          {canRemove && !disabled && (
            <button
              type="button"
              onClick={onRemove}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="col-span-2 md:col-span-1">
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Nombre *</label>
          <input
            type="text"
            value={pet.name}
            onChange={(e) => onChange('name', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white transition-all disabled:bg-slate-100 disabled:text-slate-600"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Especie *</label>
          <select
            value={pet.species}
            onChange={(e) => onChange('species', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white transition-all disabled:bg-slate-100 disabled:text-slate-600"
          >
            <option value="">Seleccionar</option>
            <option value="Canino">Canino</option>
            <option value="Felino">Felino</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Raza</label>
          <input
            type="text"
            value={pet.breed}
            onChange={(e) => onChange('breed', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white transition-all disabled:bg-slate-100 disabled:text-slate-600"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Fecha nacimiento</label>
          <input
            type="date"
            value={pet.birth_date}
            onChange={(e) => onChange('birth_date', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white transition-all disabled:bg-slate-100 disabled:text-slate-600"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Peso (kg)</label>
          <input
            type="number"
            value={pet.current_weight}
            onChange={(e) => onChange('current_weight', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white transition-all disabled:bg-slate-100 disabled:text-slate-600"
            step="0.1"
          />
        </div>

        <div className="col-span-2 md:col-span-3">
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Foto</label>
          <div
            onDragOver={disabled ? undefined : handleDragOver}
            onDragLeave={disabled ? undefined : handleDragLeave}
            onDrop={disabled ? undefined : handleDrop}
            className={`relative border-2 border-dashed rounded-xl transition-all ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50'
                : pet.photo_url || pet.photo_file
                ? 'border-emerald-200 bg-emerald-50/30'
                : 'border-slate-300 bg-white hover:border-emerald-400 hover:bg-emerald-50/30'
            }`}
            onClick={disabled ? undefined : () => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={disabled}
            />
            {pet.photo_url ? (
              <div className="flex items-center gap-4 p-3">
                <img src={pet.photo_url} alt={pet.name} className="w-16 h-16 rounded-xl object-cover shadow-md" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">Foto cargada</p>
                  {!disabled && <p className="text-xs text-slate-500">Clic para cambiar</p>}
                </div>
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onChange('photo_url', ''); }}
                    className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ) : pet.photo_file ? (
              <div className="flex items-center gap-4 p-3">
                <img src={URL.createObjectURL(pet.photo_file)} alt={pet.name} className="w-16 h-16 rounded-xl object-cover shadow-md" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">{pet.photo_file.name}</p>
                  {!disabled && <p className="text-xs text-slate-500">Clic para cambiar</p>}
                </div>
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onChange('photo_file', null); }}
                    className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ) : !disabled ? (
              <div className="flex flex-col items-center justify-center py-8 px-4">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
                  <Camera size={24} className="text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-600">Arrastra una foto aquí</p>
                <p className="text-xs text-slate-400 mt-1">o haz clic para seleccionar</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 px-4">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
                  <Camera size={24} className="text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-400">Sin foto</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}