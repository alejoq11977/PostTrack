import { useEffect, useState, useRef, useCallback } from 'react';
import { VetReport } from '../api/vet.service';
import { auth } from '@/app/providers/firebase';

interface UseRealtimeAlertsReturn {
  reports: VetReport[];
  isConnected: boolean;
  error: string | null;
}

const API_URL = '';

export const useRealtimeAlerts = (): UseRealtimeAlertsReturn => {
  const [reports, setReports] = useState<VetReport[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(async () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError('No authenticated user');
        return;
      }

      const token = await currentUser.getIdToken();
      const url = `/api/vet/alerts/stream/?token=${encodeURIComponent(token)}`;

      const eventSource = new EventSource(url);

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
        eventSource.close();
        eventSourceRef.current = null;
        setError('Connection lost. Retrying...');
        reconnectTimeoutRef.current = setTimeout(connect, 5000);
      };

      eventSourceRef.current = eventSource;
    } catch (err) {
      setError('Failed to connect');
      console.error('Error connecting to SSE:', err);
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return { reports, isConnected, error };
};