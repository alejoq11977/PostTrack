import { Lock, ShieldCheck, AlertCircle, ArrowRight, LogOut } from 'lucide-react';
import { Input } from '@/shared/components/common/Input';
import { cn } from '@/shared/utils/cn';
import { useCompleteProfile } from '../hooks/useCompleteProfile';

export const CompleteProfileForm = () => {
  const {
    password, setPassword,
    confirmPassword, setConfirmPassword,
    acceptedTerms, setAcceptedTerms,
    error, isLoading, isSessionExpired,
    handleSubmit, logout
  } = useCompleteProfile();

  return (
    <>
      {error && (
        <div className="flex flex-col gap-3 bg-red-50 border border-red-200 rounded-md p-4 mb-5 text-[13px] text-red-600 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
          
          {isSessionExpired && (
            <button
              type="button"
              onClick={logout}
              className="self-start flex items-center gap-2 bg-white border border-red-200 px-3 py-1.5 rounded-md text-red-600 font-medium hover:bg-red-50 transition-colors ml-7"
            >
              <LogOut size={14} /> Volver a iniciar sesión
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        
        <Input
          label="Nueva Contraseña"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<Lock />}
        />

        <Input
          label="Confirmar Nueva Contraseña"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          icon={<ShieldCheck />}
        />

        {/* CHECKBOX: LEY 1581 (Colombia) */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mt-6 mb-8 transition-colors hover:border-brand-200">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="w-4 h-4 mt-0.5 shrink-0 accent-brand-500 rounded border-slate-300 text-brand-500 focus:ring-brand-500 cursor-pointer"
            />
            <span className="text-[12.5px] text-slate-600 leading-relaxed select-none group-hover:text-slate-800 transition-colors">
              Autorizo el tratamiento de mis datos personales según la <strong>Ley 1581 de 2012</strong>. Entiendo que la información clínica y fotográfica recolectada será utilizada exclusivamente para el seguimiento médico de mi mascota.
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "w-full h-[46px] rounded-md border-none bg-brand-400 font-body text-[14.5px] font-semibold text-white",
            "flex items-center justify-center gap-2 tracking-[0.01em]",
            "transition-all duration-200 shadow-[0_2px_10px_rgba(42,170,138,0.38)]",
            "hover:bg-brand-500 hover:-translate-y-[1px] hover:shadow-[0_4px_16px_rgba(42,170,138,0.42)]",
            "active:translate-y-0",
            isLoading && "opacity-85 pointer-events-none"
          )}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/35 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>Actualizar y Continuar <ArrowRight size={16} strokeWidth={2.5} /></>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={logout}
          className="text-[12.5px] text-slate-400 font-medium hover:text-slate-600 transition-colors flex items-center justify-center gap-1.5 mx-auto"
        >
          ¿No es su cuenta? Cerrar sesión
        </button>
      </div>
    </>
  );
};