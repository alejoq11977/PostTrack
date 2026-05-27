import { ReactNode } from 'react';
import { X, Building2, MapPin, Phone, Mail, Hash } from 'lucide-react';
import { Clinic } from '@/features/clinics/types/clinic.model';

interface ClinicInfoModalProps {
  clinic: Clinic;
  onClose: () => void;
}

function InfoRow({
  icon,
  label,
  value,
  href,
}: {
  icon: ReactNode;
  label: string;
  value?: string | null;
  href?: string;
}) {
  const hasValue = !!(value && value.trim());
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        {hasValue && href ? (
          <a href={href} className="text-sm text-brand-700 font-medium hover:underline break-words">
            {value}
          </a>
        ) : (
          <p className="text-sm text-slate-700 font-medium break-words">{hasValue ? value : '—'}</p>
        )}
      </div>
    </div>
  );
}

export const ClinicInfoModal = ({ clinic, onClose }: ClinicInfoModalProps) => {
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-6 border-b border-slate-100 bg-gradient-to-r from-brand-50 to-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20 shrink-0">
              <Building2 size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold tracking-widest uppercase text-brand-500">Clínica</p>
              <h2 className="text-lg font-semibold text-slate-800 break-words">{clinic.name}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pt-2 pb-1 divide-y divide-slate-50">
          <InfoRow icon={<Hash size={16} />} label="NIT" value={clinic.nit} />
          <InfoRow icon={<MapPin size={16} />} label="Dirección" value={clinic.address} />
          <InfoRow
            icon={<Phone size={16} />}
            label="Teléfono"
            value={clinic.phone}
            href={clinic.phone ? `tel:${clinic.phone}` : undefined}
          />
          <InfoRow
            icon={<Mail size={16} />}
            label="Correo"
            value={clinic.email}
            href={clinic.email ? `mailto:${clinic.email}` : undefined}
          />
        </div>

        <div className="p-6 pt-3">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
