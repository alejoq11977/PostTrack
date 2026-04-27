import { useEffect, useState } from 'react';
import { apiClient } from '@/shared/api/client';
import { PrivacyPolicy } from '../types/user.model';

export const usePrivacyPolicy = () => {
  const [policy, setPolicy] = useState<PrivacyPolicy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<PrivacyPolicy>('/users/privacy-policy/active/')
      .then((res) => setPolicy(res.data))
      .catch(() => setError('No se pudo cargar el aviso de privacidad.'))
      .finally(() => setIsLoading(false));
  }, []);

  return { policy, isLoading, error };
};