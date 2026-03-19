import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // <-- IMPORTANTE: Para cambiar de página
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/app/providers/firebase';
import { Mail, Lock, Check, AlertCircle, ArrowRight } from 'lucide-react';
import { Input } from '@/shared/components/common/Input';
import { cn } from '@/shared/utils/cn';
import { Logo } from '@/shared/components/common/Logo';
import { useAuth } from '@/features/auth/hooks/useAuth'; // <-- IMPORTANTE: Nuestro estado global

export const Login = () => {
  const [email, setEmail] = useState('');
  const[password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '', global: '' });
  const [isLoading, setIsLoading] = useState(false);

  // === MAGIA DE REDIRECCIÓN ===
  const navigate = useNavigate();
  const { user } = useAuth(); 

  // Si el usuario ya está autenticado, lo enviamos a su lista de mascotas/pacientes
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  },[user, navigate]);
  // ============================

  const validate = () => {
    let isValid = true;
    const newErrors = { email: '', password: '', global: '' };

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Ingrese un correo electrónico válido.';
      isValid = false;
    }
    if (!password) {
      newErrors.password = 'Ingrese su contraseña.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      // Firebase valida las credenciales. 
      // Si todo sale bien, AuthContext se entera y actualiza la variable 'user', 
      // lo que dispara el useEffect de arriba y cambia la pantalla.
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setErrors(prev => ({ 
        ...prev, 
        global: 'Correo o contraseña incorrectos. Por favor verifique e intente de nuevo.' 
      }));
      setIsLoading(false); // Solo apagamos el loading si hay error
    } 
  };

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
            {[
              "Reportes de evolución en tiempo real",
              "Registro fotográfico por consulta",
              "Historial clínico centralizado",
            ].map((feature, idx) => (
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

      {/* RIGHT PANEL (FORM) */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 overflow-y-auto">
        <div className="w-full max-w-[420px] animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Mobile Logo */}
          <div className="flex md:hidden justify-center mb-8">
            <Logo className="w-40 h-auto" />
          </div>

          <div className="mb-8">
            <p className="text-[11px] font-semibold tracking-[0.09em] uppercase text-brand-400 mb-1.5">
              Portal de acceso
            </p>
            <h1 className="font-display text-[26px] text-slate-800 leading-snug mb-1.5">
              Bienvenido<br />de nuevo
            </h1>
            <p className="text-[13.5px] text-slate-500 leading-relaxed">
              Ingrese sus credenciales para acceder al sistema de seguimiento.
            </p>
          </div>

          {/* Global Error Alert */}
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
              <a href="#" className="text-[12.5px] text-brand-500 font-medium hover:text-brand-600 hover:underline transition-colors">
                ¿Olvidó su contraseña?
              </a>
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
                <>
                  Ingresar <ArrowRight size={16} strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[11px] text-slate-400 mt-8 leading-relaxed">
            ¿Necesita ayuda? Contacte al administrador del sistema.<br />
            © 2026 PostTrack · Información confidencial
          </p>

        </div>
      </div>
    </div>
  );
};