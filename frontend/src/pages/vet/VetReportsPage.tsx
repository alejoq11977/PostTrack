import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, Search, ChevronRight, CheckCircle, Clock, AlertTriangle, X, RefreshCw } from 'lucide-react';
import { vetService, VetReport } from '@/features/vet/api/vet.service';

const RISK_STYLES = {
  HIGH: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', badge: 'bg-red-100 text-red-700' },
  MEDIUM: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-700' },
  LOW: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600', badge: 'bg-green-100 text-green-700' },
};

const STATUS_STYLES = {
  PENDING: { icon: Clock, text: 'text-amber-600', bg: 'bg-amber-50' },
  REVIEWED: { icon: CheckCircle, text: 'text-emerald-600', bg: 'bg-emerald-50' },
};

const FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'reviewed', label: 'Revisados' },
];

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `hace ${diffDays}d`;
  if (diffHours > 0) return `hace ${diffHours}h`;
  if (diffMins > 0) return `hace ${diffMins}min`;
  return 'recién';
}

export const VetReportsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const monitoringId = searchParams.get('monitoring');
  const [reports, setReports] = useState<VetReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed'>('all');
  const [search, setSearch] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      const filterParam = filter === 'all' ? undefined : filter;
      const data = await vetService.getReports(filterParam, monitoringId ? parseInt(monitoringId) : undefined);
      let results = [];

      if (Array.isArray(data)) {
        results = data;
      } else if (data && typeof data === 'object' && Array.isArray(data.results)) {
        results = data.results;
      } else if (data && typeof data === 'object') {
        console.log('[VetReports] Data keys:', Object.keys(data));
        results = [];
      }

      console.log('[VetReports] Final results:', results);
      setReports(results);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching reports:', err);
    }
  }, [filter, monitoringId]);

  useEffect(() => {
    document.title = 'Reportes - PostTrack';
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchReports().finally(() => setIsLoading(false));
  }, [fetchReports]);

  const filteredReports = search
    ? reports.filter(r =>
        r.patient_name.toLowerCase().includes(search.toLowerCase()) ||
        r.owner_name.toLowerCase().includes(search.toLowerCase())
      )
    : reports;

  const getRiskConfig = (risk: string | null) => {
    if (!risk) return RISK_STYLES.LOW;
    return RISK_STYLES[risk as keyof typeof RISK_STYLES] || RISK_STYLES.LOW;
  };

  const getStatusConfig = (status: string) => {
    return STATUS_STYLES[status as keyof typeof STATUS_STYLES] || STATUS_STYLES.PENDING;
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-display font-semibold text-slate-800 tracking-tight">
              Reportes
            </h1>
            {monitoringId && (
              <button
                onClick={() => setSearchParams({})}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-100 text-brand-700 rounded-full text-xs font-medium hover:bg-brand-200 transition-colors"
              >
                <X size={14} />
                Filtrado por seguimiento
              </button>
            )}
          </div>
          <p className="text-slate-400 text-[13px] mt-1">
            {lastUpdated
              ? `Actualizado: ${lastUpdated.toLocaleTimeString()}`
              : 'Cargando...'}
          </p>
        </div>
        <button
          onClick={fetchReports}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:bg-slate-300 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          Recargar
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value as typeof filter)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                filter === f.value
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por paciente o dueño..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>
      </div>

      {/* Reports List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-white rounded-xl border border-slate-200 h-28" />
          ))}
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <FileText size={48} className="text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No hay reportes {filter !== 'all' ? filter : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map(report => {
            const riskConfig = getRiskConfig(report.calculated_risk);
            const statusConfig = getStatusConfig(report.review_status);
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={report.id}
                onClick={() => navigate(`/vet/reports/${report.id}`)}
                className={`bg-white rounded-xl border ${riskConfig.border} p-4 cursor-pointer hover:shadow-md transition-all group`}
              >
                <div className="flex items-center gap-4">
                  {/* Risk indicator */}
                  <div className={`w-12 h-12 rounded-lg ${riskConfig.bg} flex items-center justify-center`}>
                    {report.calculated_risk === 'HIGH' && <AlertTriangle size={24} className={riskConfig.text} />}
                    {report.calculated_risk === 'MEDIUM' && <AlertTriangle size={24} className={riskConfig.text} />}
                    {report.calculated_risk === 'LOW' && <CheckCircle size={24} className={riskConfig.text} />}
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${riskConfig.badge}`}>
                        {report.calculated_risk || 'SIN DATOS'}
                      </span>
                      <span className="text-xs text-slate-400">Día {report.day_number}</span>
                      <span className={`flex items-center gap-1 text-xs ${statusConfig.text}`}>
                        <StatusIcon size={12} />
                        {report.review_status === 'PENDING' ? 'Pendiente' : 'Revisado'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-800 truncate">{report.patient_name}</h3>
                    <p className="text-sm text-slate-500 truncate">
                      {report.surgery_type} · {report.owner_name}
                    </p>
                  </div>

                  {/* Time and arrow */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs text-slate-400">{formatTimeAgo(report.submitted_at)}</span>
                    </div>
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-brand-500 transition-colors" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};