import { Users } from 'lucide-react';

export const VetUsersPage = () => {
  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-[24px] font-display font-semibold text-slate-800 tracking-tight">
          Propietarios
        </h1>
        <p className="text-slate-400 text-[13px] mt-1">
          Gestiona propietarios y sus mascotas
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <Users size={48} className="text-slate-300 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-slate-700 mb-2">Gestión de usuarios en desarrollo</h2>
        <p className="text-slate-500 text-sm">
          Lista de propietarios, búsqueda y creación se implementarán proximamente.
        </p>
      </div>
    </div>
  );
};