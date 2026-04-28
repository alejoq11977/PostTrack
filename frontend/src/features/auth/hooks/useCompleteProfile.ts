import { useState } from 'react';
import { updatePassword } from 'firebase/auth';
import { auth } from '@/app/providers/firebase';
import { authService } from '../api/auth.service';
import { useAuth } from './useAuth';

export const useCompleteProfile = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  const { logout } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSessionExpired(false);

    if (password.length < 6) {
      return setError('La nueva contraseña debe tener al menos 6 caracteres.');
    }
    if (password !== confirmPassword) {
      return setError('Las contraseñas no coinciden.');
    }

    setIsLoading(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('No hay sesión activa.');

      await updatePassword(currentUser, password);
      await authService.completeProfile();

      window.location.replace('/');

    } catch (err: any) {
      console.error(err);
      
      if (err.code === 'auth/requires-recent-login') {
        setError('Por seguridad, debe haber iniciado sesión recientemente para cambiar su contraseña.');
        setIsSessionExpired(true); 
      } else {
        setError('Ocurrió un error al actualizar su perfil. Verifique su conexión e intente nuevamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    password, setPassword,
    confirmPassword, setConfirmPassword,
    error, isLoading, isSessionExpired, 
    handleSubmit, logout 
  };
};