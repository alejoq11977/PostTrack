import { AuthLayout } from '@/shared/components/layouts/AuthLayout';
import { CompleteProfileForm } from '@/features/auth/components/CompleteProfileForm';

export const CompleteProfile = () => {
  return (
    <AuthLayout
      eyebrow="Paso Requerido"
      title="Seguridad de<br/>su cuenta"
      subtitle="Por políticas de seguridad, debe cambiar su contraseña temporal y aceptar el tratamiento de datos."
    >
      <CompleteProfileForm />
    </AuthLayout>
  );
};