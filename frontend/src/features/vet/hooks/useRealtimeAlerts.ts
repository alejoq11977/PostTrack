import { useEffect, useState, useRef, useCallback } from 'react';
import { VetReport, MissingReport, vetService } from '../api/vet.service';
import { auth } from '@/app/providers/firebase';

interface UseRealtimeAlertsOptions {
  initialReports?: VetReport[];
  initialAlerts?: VetReport[];
}

interface UseRealtimeAlertsReturn {
  reports: VetReport[];
  alerts: VetReport[];
  missingReports: MissingReport[];
  alertCount: number;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl.replace(/\/api$/, '');
  }
  if (import.meta.env.DEV) {
    return 'http://localhost:8000';
  }
  return window.location.origin;
};

export function useRealtimeAlerts(options: UseRealtimeAlertsOptions = {}): UseRealtimeAlertsReturn {
  const { initialReports = [], initialAlerts = [] } = options;
  const [reports, setReports] = useState<VetReport[]>(initialReports);
  const [alerts, setAlerts] = useState<VetReport[]>(initialAlerts);
  const [missingReports, setMissingReports] = useState<MissingReport[]>([]);
  const [alertCount, setAlertCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectDelay = 30000;

  const loadInitialData = useCallback(async () => {
    try {
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      if (!token) return;

      const baseUrl = getApiBaseUrl();
      const headers = { 'Authorization': `Bearer ${token}` };

      const [reportsRes, alertsRes, missingRes] = await Promise.all([
        fetch(`${baseUrl}/api/vet/reports/?filter=pending`, { headers }),
        fetch(`${baseUrl}/api/vet/alerts/all/`, { headers }),
        fetch(`${baseUrl}/api/vet/reports/missing/`, { headers })
      ]);

      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        setReports(reportsData.results || reportsData);
      }

      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setAlerts(alertsData.results || alertsData);
        const highCount = (alertsData.results || alertsData).filter((r: VetReport) => r.calculated_risk === 'HIGH').length;
        setAlertCount(highCount);
      }

      if (missingRes.ok) {
        const missingData = await missingRes.json();
        setMissingReports(missingData.results || missingData);
      }

      setIsLoading(false);
    } catch (err) {
      console.error('[SSE] Error loading initial data:', err);
      setIsLoading(false);
    }
  }, []);

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
      const baseUrl = getApiBaseUrl();
      const url = `${baseUrl}/api/vet/alerts/stream/?token=${encodeURIComponent(token)}`;

      console.log('[SSE] Connecting to:', url.substring(0, 80) + '...');

      const eventSource = new EventSource(url);

      eventSource.onopen = () => {
        console.log('[SSE] Connected successfully');
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onmessage = (event) => {
        console.log('[SSE] Message received:', event.data);
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'reports_update') {
            if (data.reports) {
              setReports(prev => mergeReports(prev, data.reports));
            }
            if (data.alerts) {
              setAlerts(prev => mergeReports(prev, data.alerts));
            }
            if (typeof data.alert_count === 'number') {
              setAlertCount(data.alert_count);
            }
          }
        } catch (err) {
          console.error('[SSE] Error parsing message:', err);
        }
      };

      eventSource.onerror = (err) => {
        console.error('[SSE] Error event:', err);
        setIsConnected(false);
        eventSource.close();
        eventSourceRef.current = null;

        const currentUrl = eventSource.url || '';
        const isAuthError = currentUrl.includes('token=test') || currentUrl.includes('token=undefined');

        if (isAuthError || reconnectAttemptsRef.current >= 5) {
          setError('Authentication error. Please refresh the page.');
          return;
        }

        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), maxReconnectDelay);
        console.log(`[SSE] Reconnecting in ${delay}ms...`);
        setError(`Connection lost. Retrying in ${delay/1000}s...`);
        reconnectTimeoutRef.current = setTimeout(connect, delay);
        reconnectAttemptsRef.current++;
      };

      eventSourceRef.current = eventSource;
    } catch (err) {
      console.error('[SSE] Connection error:', err);
      setError('Failed to connect');
    }
  }, []);

  useEffect(() => {
    loadInitialData();
    connect();

    const pollMissing = setInterval(async () => {
      try {
        const data = await vetService.getMissingReports();
        setMissingReports(data);
      } catch (err) {
        console.error('[Poll] Error fetching missing reports:', err);
      }
    }, 30000);

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      clearInterval(pollMissing);
    };
  }, [connect, loadInitialData]);

  return { reports, alerts, missingReports, alertCount, isConnected, isLoading, error };
}

function mergeReports(existing: VetReport[], incoming: VetReport[]): VetReport[] {
  const merged = [...existing];
  for (const report of incoming) {
    const index = merged.findIndex(r => r.id === report.id);
    if (index >= 0) {
      merged[index] = report;
    } else {
      merged.push(report);
    }
  }
  return merged;
}