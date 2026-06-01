import { apiClient } from '@/shared/api/client';

export interface VetAnswer {
  id: number;
  question_text: string;
  value: string;
  type?: 'general' | 'custom';
  instruction_text?: string | null;
  present?: boolean | null;
  risk_level?: 'LOW' | 'MEDIUM' | 'HIGH' | null;
}

export interface VetQuestion {
  id: number;
  text: string;
  instruction_text: string | null;
}

export interface VetEvidence {
  id: number;
  image_url: string;
  created_at: string;
}

export interface VetReport {
  id: number;
  monitoring_id: number;
  submitted_at: string;
  calculated_risk: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  validated_risk: string | null;
  review_status: 'PENDING' | 'REVIEWED';
  medical_notes: string | null;
  day_number: number;
  patient_name: string;
  patient_photo: string | null;
  owner_name: string;
  owner_phone: string | null;
  owner_email: string | null;
  surgery_type: string;
  general_questions: VetQuestion[];
  custom_questions: VetQuestion[];
  answers: VetAnswer[];
  general_notes: string;
  evidences: VetEvidence[];
  monitoring?: {
    patient?: {
      name: string;
      owner?: {
        full_name: string;
      };
    };
  };
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface VetOwner {
  id: number;
  full_name: string;
  email: string;
  identification_type: string | null;
  identification_number: string | null;
  phone_number: string | null;
  address: string | null;
  patients_count: number;
  patients: VetPatient[];
  created_at: string;
}

export interface VetPatient {
  id: number;
  name: string;
  species: string;
  breed: string;
  birth_date: string;
  current_weight: number;
  photo_url: string | null;
  owner_id?: number;
  owner_name?: string;
  owner_phone?: string | null;
  owner_email?: string | null;
}

export interface VetMonitoring {
  id: number;
  surgery_type: string;
  surgery_date: string;
  home_release_date: string | null;
  discharged_at: string | null;
  days_since_surgery: number | null;
  days_since_release: number | null;
  report_frequency_hours: number;
  status: string;
  patient_name: string;
  owner_name: string;
  owner_email: string;
  owner_identification_number: string;
  active_reports: number;
}

export interface MissingReport {
  id: number;
  patient_name: string;
  patient_photo: string | null;
  owner_name: string;
  owner_phone: string | null;
  owner_email: string | null;
  owner_identification_number?: string;
  surgery_type: string;
  surgery_date: string;
  day_number: number;
  report_frequency_hours: number;
  last_report_at: string | null;
  expected_at: string;
  minutes_overdue: number;
}

export const vetService = {
  getReports: async (
    filter?: 'pending' | 'reviewed' | 'all',
    monitoringId?: number,
    limit?: number,
    offset?: number
  ): Promise<PaginatedResponse<VetReport>> => {
    const params = new URLSearchParams();
    if (filter) params.append('filter', filter);
    if (monitoringId) params.append('monitoring', monitoringId.toString());
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.get(`/vet/reports/${queryString}`);
    return response.data;
  },

  getAlerts: async (page?: number, limit?: number): Promise<PaginatedResponse<VetReport>> => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    const response = await apiClient.get(`/vet/alerts/all/?${params.toString()}`);
    return response.data;
  },

  getReport: async (id: number): Promise<VetReport> => {
    const response = await apiClient.get<VetReport>(`/vet/reports/${id}/`);
    return response.data;
  },

  validateReport: async (id: number, data: { validated_risk?: string; justification?: string }): Promise<void> => {
    await apiClient.patch(`/vet/reports/${id}/validate/`, data);
  },

  markReportReviewed: async (id: number): Promise<void> => {
    await apiClient.patch(`/vet/reports/${id}/mark-reviewed/`);
  },

  getOwners: async (search?: string): Promise<VetOwner[]> => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const response = await apiClient.get<VetOwner[]>(`/vet/owners/${params}`);
    return response.data;
  },

  searchOwners: async (search: string): Promise<VetOwner[]> => {
    const response = await apiClient.get<VetOwner[]>(`/vet/owners/?search=${encodeURIComponent(search)}`);
    return response.data;
  },

  createOwner: async (data: {
    full_name: string;
    email: string;
    identification_type: string;
    password?: string;
    confirm_password?: string;
    identification_number: string;
    phone_number?: string;
    address?: string;
  }): Promise<VetOwner> => {
    const response = await apiClient.post<VetOwner>('/vet/owners/', data);
    return response.data;
  },

  updateOwner: async (id: number, data: Partial<VetOwner>): Promise<VetOwner> => {
    const response = await apiClient.patch<VetOwner>(`/vet/owners/${id}/`, data);
    return response.data;
  },

  searchPatients: async (search: string): Promise<VetPatient[]> => {
    const response = await apiClient.get<VetPatient[]>(`/vet/patients/search/?search=${encodeURIComponent(search)}`);
    return response.data;
  },

  createPatient: async (data: {
    owner_id: number;
    name: string;
    species: string;
    breed: string;
    birth_date: string;
    current_weight: number;
    photo_url?: string;
  }): Promise<VetPatient> => {
    const response = await apiClient.post<VetPatient>('/vet/patients/', data);
    return response.data;
  },

  updatePatient: async (id: number, data: {
    name: string;
    species: string;
    breed: string;
    birth_date: string;
    current_weight: number;
    photo_url?: string;
  }): Promise<VetPatient> => {
    const response = await apiClient.patch<VetPatient>(`/vet/patients/${id}/`, data);
    return response.data;
  },

  getMonitorings: async (): Promise<VetMonitoring[]> => {
    const response = await apiClient.get<VetMonitoring[]>('/vet/monitorings/');
    return response.data;
  },

  createMonitoring: async (data: {
    patient_id: number;
    surgery_type: string;
    surgery_date: string;
    home_release_date?: string | null;
    report_frequency_hours: number;
    status?: string;
    custom_questions?: { text: string; instruction_text?: string }[];
  }): Promise<VetMonitoring> => {
    const response = await apiClient.post<VetMonitoring>('/vet/monitorings/', data);
    return response.data;
  },

  releaseMonitoring: async (id: number, date?: string): Promise<VetMonitoring> => {
    const response = await apiClient.post<VetMonitoring>(
      `/vet/monitorings/${id}/release/`,
      date ? { home_release_date: date } : {}
    );
    return response.data;
  },

  dischargeMonitoring: async (id: number): Promise<VetMonitoring> => {
    const response = await apiClient.post<VetMonitoring>(`/vet/monitorings/${id}/discharge/`, {});
    return response.data;
  },

  getMissingReports: async (limit?: number, offset?: number): Promise<PaginatedResponse<MissingReport>> => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.get<{ count: number; next: string | null; previous: string | null; results: MissingReport[] }>(`/vet/reports/missing/${queryString}`);
    return response.data;
  },

  getStats: async (): Promise<{ pending: number; reviewed_today: number; total_active: number; high_risk: number }> => {
    const response = await apiClient.get('/vet/reports/stats/');
    return response.data;
  },
};