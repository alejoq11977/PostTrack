import { Lock, ShieldCheck, AlertCircle, ArrowRight, LogOut, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/shared/components/common/Input';
import { cn } from '@/shared/utils/cn';
import { useState } from 'react';
import { useCompleteProfile } from '../hooks/useCompleteProfile';

export const CompleteProfileForm = () => {
  const {
    password, setPassword,
    confirmPassword, setConfirmPassword,
    error, isLoading, isSessionExpired,
    handleSubmit, logout
  } = useCompleteProfile();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordRequirements = [
    { label: '8 caracteres mínimo', met: password.length >= 8 },
    { label: 'Al menos un número', met: /[0-9]/.test(password) },
    { label: 'Al menos un carácter especial (ej: !@#$%^&*).', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

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
        <div className="relative">
          <Input
            label="Nueva Contraseña"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock />}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {password.length > 0 && (
          <div className="flex flex-col gap-1.5 mb-2">
            {passwordRequirements.map((req, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${req.met ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                  {req.met ? '✓' : '·'}
                </div>
                <span className={req.met ? 'text-emerald-600' : 'text-slate-500'}>{req.label}</span>
              </div>
            ))}
          </div>
        )}

        <div className="relative">
          <Input
            label="Confirmar Nueva Contraseña"
            type={showConfirm ? 'text' : 'password'}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            icon={<ShieldCheck />}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
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