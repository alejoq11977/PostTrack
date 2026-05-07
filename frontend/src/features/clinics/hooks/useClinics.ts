import { useState, useEffect, useCallback } from 'react';
import { clinicService } from '../api/clinic.service';
import { Clinic, PendingTermsResponse } from '../types/clinic.model';

const CLINIC_STORAGE_KEY = 'posttrack_active_clinic_id';

export const useClinics = () => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [activeClinic, setActiveClinicState] = useState<Clinic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadClinics = async () => {
      try {
        const clinicsData = await clinicService.getClinics();
        setClinics(clinicsData);

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
      } catch (err) {
        setError('Error al cargar las clínicas');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadClinics();
  }, []);

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

  return {
    clinics,
    activeClinic,
    setActiveClinic,
    clearActiveClinic,
    isLoading,
    error,
  };
};

export const usePendingTerms = (clinicId: number | null) => {
  const [pendingTerms, setPendingTerms] = useState<PendingTermsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkPendingTerms = useCallback(async () => {
    if (!clinicId) {
      setPendingTerms(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await clinicService.getPendingTerms(clinicId);
      setPendingTerms(data);
    } catch (err) {
      setError('Error al verificar términos pendientes');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [clinicId]);

  useEffect(() => {
    checkPendingTerms();
  }, [checkPendingTerms]);

  return { pendingTerms, isLoading, error, refetch: checkPendingTerms };
};
