import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, TrendingUp, Clock, WifiOff, RefreshCw } from 'lucide-react';
import { useRealtimeAlerts } from '@/features/vet/hooks/useRealtimeAlerts';
import { vetService } from '@/features/vet/api/vet.service';
import { AlertsList } from '@/features/vet/components/AlertsList';
import { MissingReportsList } from '@/features/vet/components/MissingReportsList';
import { SectionHeader } from '@/features/vet/components/SectionHeader';
import { StatCardSkeleton } from '@/features/vet/components/Skeletons';

function StatCard({ icon: Icon, label, value, subtext, color, isLoading }: {
  icon: React.ElementType;
  label: string;
  value: number;
  subtext?: string;
  color: string;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return <StatCardSkeleton />;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
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
  const { reports, alerts, missingReports, alertCount, missingCount, isConnected, isLoading, isRefreshing, error, refresh } = useRealtimeAlerts();
  const [stats, setStats] = useState({ reviewed_today: 0, total_active: 0 });

  useEffect(() => {
    document.title = 'Dashboard - PostTrack';
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await vetService.getStats();
        setStats({
          reviewed_today: data.reviewed_today,
          total_active: data.total_active,
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const isInitialLoading = isLoading && reports.length === 0 && missingReports.length === 0;

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-display font-semibold text-slate-800 tracking-tight">
            Dashboard
          </h1>
          <p className="text-slate-400 text-[13px] mt-1">
            Resumen de actividad y alertas en tiempo real
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-brand-600 transition-colors disabled:opacity-50"
            title="Recargar datos"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          {isConnected ? (
            <span className="flex items-center gap-2 text-sm text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Tiempo real
            </span>
          ) : (
            <span className="flex items-center gap-2 text-sm text-slate-400">
              <WifiOff size={16} />
              Conectando...
            </span>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-3">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => window.location.reload()}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 rounded-lg text-xs font-medium transition-colors"
          >
            <RefreshCw size={14} />
            Recargar
          </button>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={AlertCircle}
          label="Alertas de Riesgo"
          value={alertCount}
          subtext="Pendientes de revisión"
          color="bg-red-500"
          isLoading={isInitialLoading}
        />
        <StatCard
          icon={CheckCircle}
          label="Revisados Hoy"
          value={stats.reviewed_today}
          subtext="Reportes procesados"
          color="bg-emerald-500"
          isLoading={isInitialLoading}
        />
        <StatCard
          icon={TrendingUp}
          label="Seguimientos Activos"
          value={stats.total_active}
          subtext="Monitoreando pacientes"
          color="bg-brand-500"
          isLoading={isInitialLoading}
        />
        <StatCard
          icon={Clock}
          label="Reportes Faltantes"
          value={missingCount}
          subtext="Overdue"
          color="bg-amber-500"
          isLoading={isInitialLoading}
        />
      </div>

      {/* Main Content - 60/40 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
        {/* Alerts Section - 60% */}
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <SectionHeader
            title="Alertas de Riesgo"
            badge={`${alertCount} alertas`}
            variant="live"
          />
          {isInitialLoading ? (
            <div className="space-y-3">
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>
          ) : (
            <AlertsList initialData={alerts} />
          )}
        </section>

        {/* Missing Reports Section - 40% */}
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <SectionHeader
            title="Reportes Faltantes"
            badge={`${missingCount} faltantes`}
            variant="alert"
          />
          {isInitialLoading ? (
            <div className="space-y-3">
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>
          ) : (
            <MissingReportsList initialData={missingReports} />
          )}
        </section>
      </div>
    </div>
  );
};
