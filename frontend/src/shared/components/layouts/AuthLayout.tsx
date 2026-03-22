import { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { Logo } from '../common/Logo';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  eyebrow?: string;
}

export const AuthLayout = ({ children, title, subtitle, eyebrow }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex bg-slate-50 overflow-hidden font-body">
      {/* LEFT PANEL */}
      <div className="hidden md:flex w-[42%] bg-brand-800 relative flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 bg-dots-pattern opacity-100 pointer-events-none"></div>
        <div className="absolute -bottom-[120px] -right-[120px] w-[420px] h-[420px] rounded-full bg-brand-400/10 pointer-events-none"></div>

        <div className="relative z-10">
          <Logo className="w-48 h-auto drop-shadow-md" />
        </div>

        <div className="relative z-10">
          <h2 className="font-display text-[32px] text-white leading-tight mb-4">
            El bienestar de<br />su mascota, siempre<br />
            <em className="text-brand-200 font-serif italic">bajo control.</em>
          </h2>
          <p className="text-sm text-white/55 leading-relaxed max-w-[300px]">
            Portal dedicado para el seguimiento postoperatorio de los pacientes. 
          </p>
          
          <ul className="flex flex-col gap-3 mt-8">
            {["Reportes de evolución en tiempo real", "Registro fotográfico por consulta", "Historial clínico centralizado"].map((feature, idx) => (
              <li key={idx} className="flex items-center gap-2.5 text-[13px] text-white/70">
                <div className="w-5 h-5 rounded-full bg-brand-400/20 border border-brand-400/40 flex items-center justify-center shrink-0">
                  <Check size={12} className="text-brand-200" strokeWidth={3} />
                </div>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-[11px] text-white/30">
          © 2026 PostTrack · Todos los derechos reservados
        </p>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 overflow-y-auto">
        <div className="w-full max-w-[420px] animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Mobile Logo */}
          <div className="flex md:hidden justify-center mb-8">
            <Logo className="w-40 h-auto" />
          </div>

          <div className="mb-8">
            {eyebrow && <p className="text-[11px] font-semibold tracking-[0.09em] uppercase text-brand-400 mb-1.5">{eyebrow}</p>}
            <h1 className="font-display text-[26px] text-slate-800 leading-snug mb-1.5" dangerouslySetInnerHTML={{ __html: title }} />
            <p className="text-[13.5px] text-slate-500 leading-relaxed">{subtitle}</p>
          </div>

          {children}

          <p className="text-center text-[11px] text-slate-400 mt-8 leading-relaxed">
            ¿Necesita ayuda? Contacte al administrador del sistema.<br />
            © 2026 PostTrack · Información confidencial
          </p>
        </div>
      </div>
    </div>
  );
};