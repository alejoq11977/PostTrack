import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react';
import { VetReport, vetService } from '../api/vet.service';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { AlertCardSkeleton } from './Skeletons';

interface AlertsListProps {
  initialData: VetReport[];
}

const RISK_STYLES = {
  HIGH: { border: 'border-red-300', badge: 'bg-red-100 text-red-700', indicator: 'bg-red-500' },
  MEDIUM: { border: 'border-amber-300', badge: 'bg-amber-100 text-amber-700', indicator: 'bg-amber-500' },
  LOW: { border: 'border-emerald-300', badge: 'bg-emerald-100 text-emerald-700', indicator: 'bg-emerald-500' },
  null: { border: 'border-slate-200', badge: 'bg-slate-100 text-slate-600', indicator: 'bg-slate-400' },
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'recién';
  if (diffMins < 60) return `hace ${diffMins}min`;
  if (diffHours < 24) return `hace ${diffHours}h`;
  if (diffDays < 7) return `hace ${diffDays}d`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function AlertCard({ report }: { report: VetReport }) {
  const riskStyle = RISK_STYLES[report.calculated_risk as keyof typeof RISK_STYLES] || RISK_STYLES.null;

  return (
    <Link
      to={`/vet/reports/${report.id}`}
      className={`block bg-white rounded-xl border ${riskStyle.border} p-4 hover:shadow-md transition-all duration-200 group`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-1.5 h-12 rounded-full ${riskStyle.indicator}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-medium text-slate-800 text-sm truncate">
              {report.patient_name || 'Sin paciente'}
            </span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${riskStyle.badge}`}>
              {report.calculated_risk || 'SIN DATOS'}
            </span>
          </div>
          <p className="text-slate-500 text-xs mb-2 truncate">
            {report.owner_name || 'Sin propietario'} · {report.surgery_type}
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              Día {report.day_number}
            </span>
            {report.submitted_at && (
              <span className="text-emerald-600 font-medium">
                {formatTimeAgo(report.submitted_at)}
              </span>
            )}
            {report.review_status === 'PENDING' && (
              <span className="flex items-center gap-1 text-amber-600">
                <AlertTriangle size={12} />
                Pendiente
              </span>
            )}
            {report.review_status === 'REVIEWED' && (
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle size={12} />
                Revisado
              </span>
            )}
          </div>
        </div>
        <ChevronRight size={18} className="text-slate-300 group-hover:text-brand-500 transition-colors mt-2" />
      </div>
    </Link>
  );
}

export function AlertsList({ initialData }: AlertsListProps) {
  const [alerts, setAlerts] = useState<VetReport[]>(initialData);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialData.length >= 10);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setAlerts(initialData);
    setPage(1);
    setHasMore(initialData.length >= 10);
  }, [initialData]);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const nextPage = page + 1;
      const response = await vetService.getAlerts(nextPage, 10);
      setAlerts(prev => [...prev, ...response.results]);
      setHasMore(response.next !== null);
      setPage(nextPage);
    } catch (err) {
      console.error('[AlertsList] Error loading more:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, isLoading, hasMore]);

  const observerRef = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    isLoading,
  });

  if (alerts.length === 0 && !isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <CheckCircle size={40} className="text-emerald-400 mx-auto mb-3" />
        <p className="text-slate-600 font-medium">Sin alertas de riesgo</p>
        <p className="text-slate-400 text-sm mt-1">Las alertas aparecerán aquí en tiempo real</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <AlertCard key={alert.id} report={alert} />
      ))}

      {isLoading && (
        <>
          <AlertCardSkeleton />
          <AlertCardSkeleton />
        </>
      )}

      <div ref={observerRef} className="h-4" />

      {!hasMore && alerts.length > 0 && (
        <p className="text-center text-xs text-slate-400 py-2">
          Fin de las alertas
        </p>
      )}
    </div>
  );
}
