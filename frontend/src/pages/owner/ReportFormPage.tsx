import { useParams, Navigate } from 'react-router-dom';
import { ReportForm } from '@/features/monitoring/components/ReportForm';

export const ReportFormPage = () => {
  const { monitoringId } = useParams();

  if (!monitoringId) {
    return <Navigate to="/" replace />;
  }

  return (
    <ReportForm monitoringId={monitoringId} />
  );
};