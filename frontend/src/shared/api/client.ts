import axios from 'axios';
import { auth } from '@/app/providers/firebase';

const CLINIC_STORAGE_KEY = 'posttrack_active_clinic_id';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }

    const clinicId = localStorage.getItem(CLINIC_STORAGE_KEY);
    if (clinicId) {
      config.headers['X-Clinic-Id'] = clinicId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("Token inválido o expirado. Acceso denegado.");
    }
    if (error.response?.status === 403 && error.response?.data?.code === 'CLINIC_SELECTION_REQUIRED') {
      console.error("Selecciona una clínica para continuar.");
    }
    return Promise.reject(error);
  }
);