import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { clinicService } from '../api/clinic.service';
import { Clinic } from '../types/clinic.model';

const CLINIC_STORAGE_KEY = 'posttrack_active_clinic_id';

interface ClinicContextType {
  clinics: Clinic[];
  activeClinic: Clinic | null;
  isLoading: boolean;
  error: string | null;
  setActiveClinic: (clinic: Clinic | null) => void;
  clearActiveClinic: () => void;
  refetchClinics: () => Promise<void>;
}

const ClinicContext = createContext<ClinicContextType | null>(null);

export const ClinicProvider = ({ children }: { children: ReactNode }) => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [activeClinic, setActiveClinicState] = useState<Clinic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClinics = useCallback(async () => {
    try {
      const data = await clinicService.getClinics();
      setClinics(data);
      setError(null);
      return data;
    } catch (err) {
      setError('Error al cargar las clínicas');
      console.error(err);
      return [];
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      const clinicsData = await fetchClinics();

      const storedClinicId = localStorage.getItem(CLINIC_STORAGE_KEY);
      if (storedClinicId) {
        const clinicId = parseInt(storedClinicId, 10);
        const found = clinicsData.find((c) => c.id === clinicId);
        if (found) {
          setActiveClinicState(found);
        } else {
          localStorage.removeItem(CLINIC_STORAGE_KEY);
        }
      }
      setIsLoading(false);
    };

    initialize();
  }, [fetchClinics]);

  const setActiveClinic = useCallback((clinic: Clinic | null) => {
    setActiveClinicState(clinic);
    if (clinic) {
      localStorage.setItem(CLINIC_STORAGE_KEY, clinic.id.toString());
    } else {
      localStorage.removeItem(CLINIC_STORAGE_KEY);
    }
  }, []);

  const clearActiveClinic = useCallback(() => {
    setActiveClinicState(null);
    localStorage.removeItem(CLINIC_STORAGE_KEY);
  }, []);

  const refetchClinics = useCallback(async () => {
    setIsLoading(true);
    await fetchClinics();
    setIsLoading(false);
  }, [fetchClinics]);

  return (
    <ClinicContext.Provider
      value={{
        clinics,
        activeClinic,
        isLoading,
        error,
        setActiveClinic,
        clearActiveClinic,
        refetchClinics,
      }}
    >
      {children}
    </ClinicContext.Provider>
  );
};

export const useClinic = () => {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
};
