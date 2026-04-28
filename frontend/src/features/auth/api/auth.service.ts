import { apiClient } from '@/shared/api/client';
import { UserProfile } from '../types/user.model';

export const authService = {
  getMe: async (): Promise<UserProfile> => {
    const response = await apiClient.get<UserProfile>('/users/me/');
    return response.data;
  },
  
  completeProfile: async (): Promise<void> => {
    await apiClient.post('/users/complete-profile/', { terms_accepted: true });
  },

  updateProfile: async (data: { phone_number?: string; address?: string }): Promise<UserProfile> => {
    const response = await apiClient.patch<UserProfile>('/users/me/', data);
    return response.data;
  },

  deactivateAccount: async (): Promise<void> => {
    await apiClient.post('/users/deactivate/');
  }
};