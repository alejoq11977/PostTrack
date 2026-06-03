import { Link } from 'react-router-dom';
import { Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { Input } from '@/shared/components/common/Input';
import { cn } from '@/shared/utils/cn';
import { useLogin } from '../hooks/useLogin';

export const LoginForm = () => {
  const { email, setEmail, password, setPassword, errors, isLoading, handleSubmit } = useLogin();

  return (
    <>
      {errors.global && (
        <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-md p-3 mb-5 text-[13px] text-red-600">
          <AlertCircle size={16} className="text-red-500 shrink-0" />
          <span>{errors.global}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <Input
          label="Correo electrónico"
          type="email"
          placeholder="correo@ejemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail />}
          error={errors.email}
        />

        <Input
          label="Contraseña"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<Lock />}
          error={errors.password}
        />

        <div className="flex justify-end -mt-1 mb-6">
          <Link to="/forgot-password" className="text-[12.5px] text-brand-500 font-medium hover:text-brand-600 hover:underline transition-colors">
            ¿Olvidó su contraseña?
          </Link>
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
            <>Ingresar <ArrowRight size={16} strokeWidth={2.5} /></>
          )}
        </button>
      </form>
    </>
  );
};