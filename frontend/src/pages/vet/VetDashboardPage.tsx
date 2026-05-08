import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, AlertTriangle, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import { useRealtimeAlerts } from '@/features/vet/hooks/useRealtimeAlerts';
import { VetReport } from '@/features/vet/api/vet.service';

function formatDistanceToNow(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Hace un momento';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

const getRiskColor = (risk: string | null) => {
  switch (risk) {
    case 'HIGH': return 'text-red-600 bg-red-50 border-red-100';
    case 'MEDIUM': return 'text-amber-600 bg-amber-50 border-amber-100';
    case 'LOW': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    default: return 'text-slate-500 bg-slate-50 border-slate-100';
  }
};

const getRiskBgColor = (risk: string | null) => {
  switch (risk) {
    case 'HIGH': return 'bg-red-500';
    case 'MEDIUM': return 'bg-amber-500';
    case 'LOW': return 'bg-emerald-500';
    default: return 'bg-slate-400';
  }
};

function AlertCard({ report }: { report: VetReport }) {
  return (
    <Link
      to={`/vet/reports/${report.id}`}
      className="block bg-white rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all duration-200"
    >
      <div className="flex items-start gap-3">
        <div className={`w-1.5 h-12 rounded-full ${getRiskBgColor(report.calculated_risk)}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-medium text-slate-800 text-sm truncate">
              {report.monitoring?.patient?.name || 'Sin paciente'}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getRiskColor(report.calculated_risk)}`}>
              {report.calculated_risk || 'Sin evaluar'}
            </span>
          </div>
          <p className="text-slate-500 text-xs mb-2 truncate">
            {report.monitoring?.patient?.owner?.full_name || 'Sin propietario'}
          </p>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {report.submitted_at ? formatDistanceToNow(report.submitted_at) : 'N/A'}
            </span>
            {report.review_status === 'PENDING' && (
              <span className="flex items-center gap-1 text-amber-600">
                <AlertTriangle size={12} />
                Pendiente
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function StatCard({ icon: Icon, label, value, subtext, color }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
          <Icon size={20} className="text-white" />
        </div>
        <span className="text-slate-500 text-sm">{label}</span>
      </div>
      <div className="text-2xl font-display font-semibold text-slate-800">{value}</div>
      {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
    </div>
  );
}

export const VetDashboardPage = () => {
  const { reports, isConnected, error } = useRealtimeAlerts();
  const [stats, setStats] = useState({ pending: 0, reviewed: 0, total: 0 });

  useEffect(() => {
    document.title = 'Dashboard - PostTrack';
  }, []);

  useEffect(() => {
    setStats({
      pending: reports.length,
      reviewed: 0,
      total: reports.length,
    });
  }, [reports]);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-display font-semibold text-slate-800 tracking-tight">
            Dashboard
          </h1>
          <p className="text-slate-400 text-[13px] mt-1">
            Alertas y overview de la clínica
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <span className="text-xs text-slate-500">
            {isConnected ? 'Tiempo real activo' : 'Conectando...'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={AlertTriangle}
          label="Pendientes"
          value={stats.pending}
          subtext="Reportes por revisar"
          color="bg-amber-500"
        />
        <StatCard
          icon={CheckCircle}
          label="Revisados"
          value={stats.reviewed}
          subtext="Hoy"
          color="bg-emerald-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Total activos"
          value={stats.total}
          subtext="Seguimientos activos"
          color="bg-blue-500"
        />
        <StatCard
          icon={Bell}
          label="Alertas"
          value={reports.filter(r => r.calculated_risk === 'HIGH').length}
          subtext="Riesgo alto"
          color="bg-red-500"
        />
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-700">Reportes Pendientes</h2>
            <Link
              to="/vet/reports?filter=pending"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Ver todos
            </Link>
          </div>
          {reports.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <CheckCircle size={40} className="text-emerald-400 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">No hay reportes pendientes</p>
              <p className="text-slate-400 text-sm mt-1">Los reportes aparecerán aquí en tiempo real</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.slice(0, 5).map((report) => (
                <AlertCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-700">Alertas de Riesgo Alto</h2>
            <Link
              to="/vet/reports?filter=pending"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Ver todos
            </Link>
          </div>
          {reports.filter(r => r.calculated_risk === 'HIGH').length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <CheckCircle size={40} className="text-emerald-400 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">Sin alertas de riesgo alto</p>
              <p className="text-slate-400 text-sm mt-1">Las alertas de riesgo aparecerán aquí</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports
                .filter(r => r.calculated_risk === 'HIGH')
                .slice(0, 5)
                .map((report) => (
                  <AlertCard key={report.id} report={report} />
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};