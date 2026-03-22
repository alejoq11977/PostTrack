import { AuthLayout } from '@/shared/components/layouts/AuthLayout';
import { LoginForm } from '@/features/auth/components/LoginForm';

export const Login = () => {
  return (
    <AuthLayout
      eyebrow="Portal de acceso"
      title="Bienvenido<br/>de nuevo"
      subtitle="Ingrese sus credenciales para acceder al sistema de seguimiento."
    >
      <LoginForm />
    </AuthLayout>
  );
};