import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { AuthLayout } from '@/shared/components/layouts/AuthLayout';
import { Input } from '@/shared/components/common/Input';
import { auth } from '@/app/providers/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Ingrese un correo electrónico válido.');
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setIsSuccess(true);
    } catch {
      setIsSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout
        eyebrow="Recuperar contraseña"
        title="Correo enviado"
        subtitle="Revise su bandeja de entrada y siga las instrucciones."
      >
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={24} className="text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-emerald-800 mb-2">Revise su correo</h3>
          <p className="text-sm text-emerald-700 mb-4">
            Se envió un enlace para restablecer su contraseña a:
          </p>
          <p className="text-sm font-medium text-emerald-800 mb-6">{email}</p>
          <p className="text-xs text-emerald-600">
            Si no lo ve, revise su carpeta de spam o correos no deseados.
          </p>
        </div>
        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-sm text-brand-500 hover:text-brand-600 font-medium flex items-center justify-center gap-1"
          >
            <ArrowLeft size={14} />
            Volver al inicio de sesión
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="Recuperar contraseña"
      title="¿Olvidó su<br/>contraseña?"
      subtitle="Ingrese su correo electrónico y le enviaremos un enlace para restablecerla."
    >
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-5 text-[13px] text-red-600 text-center">
          {error}
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
          error={error && error.includes('correo') ? error : ''}
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-[46px] rounded-md border-none bg-brand-400 font-body text-[14.5px] font-semibold text-white mt-6 flex items-center justify-center gap-2 tracking-[0.01em] transition-all duration-200 shadow-[0_2px_10px_rgba(42,170,138,0.38)] hover:bg-brand-500 hover:-translate-y-[1px] hover:shadow-[0_4px_16px_rgba(42,170,138,0.42)] active:translate-y-0 disabled:opacity-85 disabled:pointer-events-none"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/35 border-t-white rounded-full animate-spin"></div>
          ) : (
            'Enviar enlace'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link
          to="/login"
          className="text-sm text-brand-500 hover:text-brand-600 font-medium flex items-center justify-center gap-1"
        >
          <ArrowLeft size={14} />
          Volver al inicio de sesión
        </Link>
      </div>
    </AuthLayout>
  );
};