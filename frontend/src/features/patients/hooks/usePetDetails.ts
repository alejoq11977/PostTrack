import { useState, useEffect } from 'react';
import { patientsService } from '../api/patients.service';
import { Patient } from '../types/patient.model';
import { useClinic } from '@/features/clinics/context/ClinicContext';

export const usePetDetails = (id: string | undefined) => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { activeClinic } = useClinic();

  useEffect(() => {
    const fetchPatient = async () => {
      if (!id) return;
      try {
        const data = await patientsService.getPatients(activeClinic?.id);
        const selected = data.find(p => p.id === Number(id));
        if (selected) setPatient(selected);
      } catch (error) {
        console.error("Error cargando detalles del paciente:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatient();
  }, [id, activeClinic?.id]);

  return { patient, isLoading };
};