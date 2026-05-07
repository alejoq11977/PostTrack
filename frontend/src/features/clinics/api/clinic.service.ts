import { apiClient } from '@/shared/api/client';
import {
  Clinic,
  PendingTermsResponse,
  AcceptTermsPayload,
  AcceptTermsResponse,
  DataPolicy,
  DataAuthorization,
} from '../types/clinic.model';

export const clinicService = {
  getClinics: async (): Promise<Clinic[]> => {
    const response = await apiClient.get<Clinic[]>('/clinics/');
    return response.data;
  },

  getClinic: async (clinicId: number): Promise<Clinic> => {
    const response = await apiClient.get<Clinic>(`/clinics/${clinicId}/`);
    return response.data;
  },

  getPendingTerms: async (clinicId: number): Promise<PendingTermsResponse> => {
    const response = await apiClient.get<PendingTermsResponse>('/clinics/pending-terms/', {
      params: { clinica_id: clinicId },
    });
    return response.data;
  },

  getAllPendingTerms: async (): Promise<PendingTermsResponse[]> => {
    const response = await apiClient.get<PendingTermsResponse[]>('/clinics/all-pending-terms/');
    return response.data;
  },

  acceptTerms: async (payload: AcceptTermsPayload): Promise<AcceptTermsResponse> => {
    const response = await apiClient.post<AcceptTermsResponse>('/clinics/accept-terms/', payload);
    return response.data;
  },

  getPolicy: async (policyId: number): Promise<DataPolicy> => {
    const response = await apiClient.get<DataPolicy>(`/clinics/policies/${policyId}/`);
    return response.data;
  },

  getAuthorization: async (authorizationId: number): Promise<DataAuthorization> => {
    const response = await apiClient.get<DataAuthorization>(`/clinics/authorizations/${authorizationId}/`);
    return response.data;
  },

  logout: async (clinicId: number): Promise<void> => {
    await apiClient.post(`/clinics/${clinicId}/logout/`);
  },
};
