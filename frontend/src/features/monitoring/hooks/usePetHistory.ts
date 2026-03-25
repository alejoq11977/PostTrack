import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientsService } from '@/features/patients/api/patients.service';
import { ReportHistory } from '@/features/patients/types/patient.model';

export const usePetHistory = (monitoringId: string | undefined) => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<ReportHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const[expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    if (!monitoringId) return;

    const fetchHistory = async () => {
      try {
        const data = await patientsService.getMonitoringHistory(Number(monitoringId));
        setReports(data);
        if (data.length > 0) setExpandedId(data[0].id);
      } catch (error) {
        console.error("Error cargando historial:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [monitoringId]);

  const toggleExpand = (id: number) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return { reports, isLoading, expandedId, toggleExpand, navigate };
};