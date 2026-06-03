import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/app/providers/firebase';
import { useAuth } from './useAuth';

export const useLogin = () => {
  const [email, setEmail] = useState('');
  const[password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '', global: '' });
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  },[user, navigate]);

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
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setErrors(prev => ({ 
        ...prev, 
        global: 'Correo o contraseña incorrectos. Por favor verifique e intente de nuevo.' 
      }));
      setIsLoading(false);
    }
  };

  return {
    email, setEmail,
    password, setPassword,
    errors, isLoading,
    handleSubmit
  };
};