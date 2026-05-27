import { Activity, ChevronRight } from 'lucide-react';
import { Patient } from '../types/patient.model';

interface PetCardProps {
  patient: Patient;
  onClick: () => void;
}

export const PetCard = ({ patient, onClick }: PetCardProps) => {
  const hasActiveMonitorings = patient.monitorings?.some(m => m.status === 'ACTIVE');

  const isCat = patient.species.toLowerCase().includes('felin') || patient.species.toLowerCase().includes('gat');

  return (
    <div
      onClick={onClick}
      className="
        group bg-white rounded-xl border border-slate-200
        overflow-hidden cursor-pointer
        hover:border-slate-300 hover:shadow-sm
        transition-all duration-150
        w-full
      "
    >
      <div className="relative aspect-[4/5] bg-slate-100 overflow-hidden">
        {patient.photo_url ? (
          <img
            src={patient.photo_url}
            alt={patient.name}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100">
            <span className="text-4xl opacity-30 select-none">
              {isCat ? '🐈' : '🐕'}
            </span>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 px-3 pb-2 flex items-end justify-between">
          <span className="text-white text-lg font-semibold tracking-tight drop-shadow-sm">
            {patient.name}
          </span>
          {hasActiveMonitorings && (
            <span className="inline-flex items-center gap-1 bg-amber-400/90 text-amber-950 text-sm font-semibold px-2.5 py-1 rounded">
              <Activity size={12} strokeWidth={2.5} />
              En recuperación
            </span>
          )}
        </div>
      </div>

      <div className="px-3 py-2 flex items-center justify-between">
        <div>
          <p className="text-base text-slate-500">{patient.breed}</p>
          <span className="text-sm text-slate-400 font-medium">
            {patient.species}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:border-brand-300 group-hover:text-brand-500 transition-colors">
            <ChevronRight size={12} strokeWidth={2} />
          </div>
        </div>
      </div>
    </div>
  );
};