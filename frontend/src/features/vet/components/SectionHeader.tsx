import { ReactNode } from 'react';
import { Wifi, AlertTriangle } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  badge: string;
  variant?: 'live' | 'alert';
  icon?: ReactNode;
}

export function SectionHeader({ title, badge, variant = 'live', icon }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {icon && <span className="text-slate-500">{icon}</span>}
        <h2 className="text-lg font-semibold text-slate-700">{title}</h2>
      </div>
      <div className="flex items-center gap-2">
        {variant === 'live' && (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-medium">
            <Wifi size={12} />
            {badge}
          </span>
        )}
        {variant === 'alert' && (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-medium">
            <AlertTriangle size={12} />
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}