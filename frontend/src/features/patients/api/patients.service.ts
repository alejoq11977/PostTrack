import { apiClient } from '@/shared/api/client';
import { Patient } from '../types/patient.model';

export const patientsService = {
  getPatients: async (): Promise<Patient[]> => {
    const response = await apiClient.get<Patient[]>('/patients/');
    return response.data;
  }
};