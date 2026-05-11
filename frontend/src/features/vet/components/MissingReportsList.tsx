import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, AlertCircle, ChevronRight, CheckCircle } from 'lucide-react';
import { MissingReport, vetService } from '../api/vet.service';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { MissingReportCardSkeleton } from './Skeletons';

interface MissingReportsListProps {
  initialData: MissingReport[];
}

function formatMinutesOverdue(minutes: number): string {
  if (minutes < 60) return `${minutes} min tarde`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) return `${hours}h ${mins}m tarde`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days}d ${remainingHours}h tarde`;
}

function MissingCard({ report }: { report: MissingReport }) {
  const getDisplayValue = (value: unknown, fallback: string): string => {
    if (value === null || value === undefined || value === '') return fallback;
    if (typeof value === 'string') return value;
    return String(value);
  };

  return (
    <Link
      to={`/vet/reports?monitoring=${report.id}`}
      className="block bg-white rounded-xl border border-red-200 p-4 hover:border-red-300 hover:shadow-md transition-all duration-200 group"
    >
      <div className="flex items-start gap-3">
        <div className="w-1.5 h-12 rounded-full bg-red-500" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-medium text-slate-800 text-sm truncate">
              {getDisplayValue(report.patient_name, 'Sin paciente')}
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700 shrink-0">
              {formatMinutesOverdue(report.minutes_overdue || 0)}
            </span>
          </div>
          <p className="text-slate-500 text-xs mb-2 truncate">
            {getDisplayValue(report.owner_name, 'Sin propietario')} · {getDisplayValue(report.surgery_type, 'Sin cirugía')}
          </p>

          <div className="flex items-center gap-2 mb-2">
            {report.owner_email && (
              <span className="text-xs text-slate-500 truncate">
                📧 {report.owner_email}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              Día {report.day_number || 0}
            </span>
            <span className="flex items-center gap-1">
              <AlertCircle size={12} className="text-amber-500" />
              Cada {report.report_frequency_hours || 0}h
            </span>
          </div>

          {report.owner_identification_number && (
            <p className="text-xs text-slate-400 mt-1.5">
              ID: {report.owner_identification_number}
            </p>
          )}
        </div>
        <ChevronRight size={18} className="text-slate-300 group-hover:text-brand-500 transition-colors mt-2" />
      </div>
    </Link>
  );
}

export function MissingReportsList({ initialData }: MissingReportsListProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [allData, setAllData] = useState<MissingReport[]>(initialData);
  const [offset, setOffset] = useState(initialData.length >= 10 ? initialData.length : 0);
  const [hasMore, setHasMore] = useState(initialData.length >= 10);

  useEffect(() => {
    setAllData(initialData);
    setOffset(initialData.length >= 10 ? initialData.length : 0);
    setHasMore(initialData.length >= 10);
  }, [initialData]);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const response = await vetService.getMissingReports(10, offset);
      setAllData(prev => [...prev, ...response.results]);
      setHasMore(response.next !== null);
      setOffset(prev => prev + 10);
    } catch (err) {
      console.error('[MissingReportsList] Error loading more:', err);
    } finally {
      setIsLoading(false);
    }
  }, [offset, isLoading, hasMore]);

  const observerRef = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    isLoading,
  });

  if (allData.length === 0 && !isLoading && !hasMore) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <CheckCircle size={40} className="text-emerald-400 mx-auto mb-3" />
        <p className="text-slate-600 font-medium">No hay reportes faltantes</p>
        <p className="text-slate-400 text-sm mt-1">Todos los seguimientos están al día</p>
      </div>
    );
  }

  if (allData.length === 0 && !isLoading && hasMore) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500">Cargando reportes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {allData.map((report) => (
        <MissingCard key={report.id} report={report} />
      ))}

      {isLoading && (
        <>
          <MissingReportCardSkeleton />
          <MissingReportCardSkeleton />
        </>
      )}

      <div ref={observerRef} className="h-4" />

      {!hasMore && allData.length > 0 && (
        <p className="text-center text-xs text-slate-400 py-2">
          Fin de los reportes faltantes
        </p>
      )}
    </div>
  );
}