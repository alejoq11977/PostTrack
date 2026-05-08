import { useEffect, useState, useRef, useCallback } from 'react';
import { VetReport } from '../api/vet.service';

interface UseRealtimeAlertsReturn {
  reports: VetReport[];
  isConnected: boolean;
  error: string | null;
}

export const useRealtimeAlerts = (): UseRealtimeAlertsReturn => {
  const [reports, setReports] = useState<VetReport[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) return;

    const eventSource = new EventSource('/api/vet/alerts/stream/');

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'reports_update' && data.reports) {
          setReports(data.reports);
        }
      } catch (err) {
        console.error('Error parsing SSE message:', err);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      setError('Connection lost. Retrying...');
      eventSourceRef.current = null;
      setTimeout(connect, 5000);
    };

    eventSourceRef.current = eventSource;
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [connect]);

  return { reports, isConnected, error };
};