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
  missingCount: number;
  isConnected: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => void;
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
  const [missingCount, setMissingCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectDelay = 30000;

  const pendingUpdateRef = useRef<{
    reports?: VetReport[];
    alerts?: VetReport[];
    alert_count?: number;
    missing_count?: number;
    missing_reports?: MissingReport[];
  } | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const scheduleUpdate = useCallback(() => {
    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        if (pendingUpdateRef.current) {
          if (pendingUpdateRef.current.reports) {
            setReports(pendingUpdateRef.current.reports);
          }
          if (pendingUpdateRef.current.alerts) {
            setAlerts(pendingUpdateRef.current.alerts);
          }
          if (pendingUpdateRef.current.alert_count !== undefined) {
            setAlertCount(pendingUpdateRef.current.alert_count);
          }
          if (pendingUpdateRef.current.missing_count !== undefined) {
            setMissingCount(pendingUpdateRef.current.missing_count);
          }
          if (pendingUpdateRef.current.missing_reports !== undefined) {
            setMissingReports(pendingUpdateRef.current.missing_reports);
          }
          pendingUpdateRef.current = null;
        }
      });
    }
  }, []);

  const loadInitialData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    }
    try {
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      if (!token) return;

      const baseUrl = getApiBaseUrl();
      const clinicId = localStorage.getItem('posttrack_active_clinic_id');
      const headers: Record<string, string> = { 'Authorization': `Bearer ${token}` };
      if (clinicId) headers['X-Clinic-Id'] = clinicId;

      const [reportsRes, alertsRes, missingRes] = await Promise.all([
        fetch(`${baseUrl}/api/vet/reports/?filter=pending&limit=10`, { headers }),
        fetch(`${baseUrl}/api/vet/alerts/all/?limit=10`, { headers }),
        fetch(`${baseUrl}/api/vet/reports/missing/?limit=10`, { headers })
      ]);

      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        setReports(reportsData.results || reportsData);
      }

      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        const results = alertsData.results || alertsData;
        setAlerts(results);
        // El badge debe reflejar el total de alertas pendientes (lo que muestra la
        // lista), no solo las de riesgo ALTO. `count` es el total real (sin paginar).
        const total = typeof alertsData.count === 'number' ? alertsData.count : results.length;
        setAlertCount(total);
      }

      if (missingRes.ok) {
        const missingData = await missingRes.json();
        const results = Array.isArray(missingData.results) ? missingData.results : (Array.isArray(missingData) ? missingData : []);
        setMissingReports(results);
        const count = missingData.count || (Array.isArray(missingData.results) ? missingData.results.length : (Array.isArray(missingData) ? missingData.length : 0));
        setMissingCount(count);
      }

      setIsLoading(false);
    } catch (err) {
      console.error('[SSE] Error loading initial data:', err);
      setIsLoading(false);
    } finally {
      if (isRefresh) {
        setIsRefreshing(false);
      }
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
      const clinicId = localStorage.getItem('posttrack_active_clinic_id');
      const clinicParam = clinicId ? `&clinic_id=${encodeURIComponent(clinicId)}` : '';
      const url = `${baseUrl}/api/vet/alerts/stream/?token=${encodeURIComponent(token)}${clinicParam}`;

      console.log('[SSE] Connecting to:', url.substring(0, 80) + '...');

      const eventSource = new EventSource(url);

      eventSource.onopen = () => {
        console.log('[SSE] Connected successfully');
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'reports_update') {
            pendingUpdateRef.current = {
              reports: data.reports || [],
              alerts: data.reports || [],
              // Total de alertas pendientes (coincide con la lista), no solo ALTO.
              alert_count: typeof data.count === 'number' ? data.count : data.alert_count,
              missing_count: data.missing_count,
              missing_reports: data.missing_reports
            };
            scheduleUpdate();
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
    let isMounted = true;

    const init = async () => {
      await loadInitialData();
      if (isMounted) {
        connect();
      }
    };

    init();

    const pollMissing = setInterval(async () => {
      try {
        const data = await vetService.getMissingReports();
        setMissingReports(data.results || []);
        setMissingCount(data.count || 0);
      } catch (err) {
        console.error('[Poll] Error fetching missing reports:', err);
      }
    }, 30000);

    return () => {
      isMounted = false;
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
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

  return { reports, alerts, missingReports, alertCount, missingCount, isConnected, isLoading, isRefreshing, error, refresh: () => loadInitialData(true) };
}