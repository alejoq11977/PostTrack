import { useState, useEffect } from 'react';
import { patientsService } from '../api/patients.service';
import { Patient } from '../types/patient.model';

export const useMyPets = () => {
  const[patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await patientsService.getPatients();
        
        const sortedData = data.sort((a, b) => {
          const aHasActive = a.monitorings?.some(m => m.status === 'ACTIVE') ? 1 : 0;
          const bHasActive = b.monitorings?.some(m => m.status === 'ACTIVE') ? 1 : 0;
          
          return bHasActive - aHasActive;
        });

        setPatients(sortedData);
      } catch (error) {
        console.error("Error cargando pacientes:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPatients();
  },[]);

  return { patients, isLoading };
};