import { apiClient } from '@/shared/api/client';
import { UserProfile } from '../types/user.model';

export const authService = {
  getMe: async (): Promise<UserProfile> => {
    const response = await apiClient.get<UserProfile>('/users/me/');
    return response.data;
  }
};