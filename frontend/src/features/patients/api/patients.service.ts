import { apiClient } from '@/shared/api/client';
import { Patient, MonitoringForm, ReportHistory } from '../types/patient.model';

export interface SubmitReportPayload {
  monitoringId: number;
  generalAnswers: Record<number, 'yes' | 'no'>;
  customAnswers: Record<number, string>;
  medicalNotes: string;
  images: (File | null)[];
}

export const patientsService = {
  getPatients: async (): Promise<Patient[]> => {
    const response = await apiClient.get<Patient[]>('/patients/');
    return response.data;
  },
  
  getMonitoringForm: async (monitoringId: number): Promise<MonitoringForm> => {
    const response = await apiClient.get<MonitoringForm>(`/monitoring/${monitoringId}/form/`);
    return response.data;
  },

  submitReport: async (payload: SubmitReportPayload): Promise<void> => {
    const formData = new FormData();

    formData.append('generalAnswers', JSON.stringify(payload.generalAnswers));
    formData.append('customAnswers', JSON.stringify(payload.customAnswers));
    
    formData.append('medicalNotes', payload.medicalNotes);

    payload.images.forEach((image, index) => {
      if (image instanceof File) {
        formData.append(`image_${index}`, image);
      }
    });

    await apiClient.post(`/monitoring/${payload.monitoringId}/form/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  getMonitoringHistory: async (monitoringId: number): Promise<ReportHistory[]> => {
    const response = await apiClient.get<ReportHistory[]>(`/monitoring/${monitoringId}/history/`);
    return response.data;
  }
};