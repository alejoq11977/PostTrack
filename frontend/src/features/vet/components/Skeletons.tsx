export function AlertCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-1.5 h-12 rounded-full bg-slate-200" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="h-4 w-32 bg-slate-200 rounded" />
            <div className="h-5 w-16 bg-slate-200 rounded-full" />
          </div>
          <div className="h-3 w-48 bg-slate-200 rounded mb-3" />
          <div className="flex items-center gap-3">
            <div className="h-3 w-20 bg-slate-200 rounded" />
            <div className="h-3 w-24 bg-slate-200 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function MissingReportCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-red-200 p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-1.5 h-12 rounded-full bg-red-200" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="h-4 w-28 bg-slate-200 rounded" />
            <div className="h-5 w-20 bg-red-200 rounded-full" />
          </div>
          <div className="h-3 w-40 bg-slate-200 rounded mb-2" />
          <div className="h-3 w-36 bg-slate-200 rounded mb-2" />
          <div className="flex items-center gap-3 mt-3">
            <div className="h-3 w-16 bg-slate-200 rounded" />
            <div className="h-3 w-20 bg-slate-200 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-slate-200" />
        <div className="h-4 w-24 bg-slate-200 rounded" />
      </div>
      <div className="h-8 w-16 bg-slate-200 rounded mb-2" />
      <div className="h-3 w-20 bg-slate-200 rounded" />
    </div>
  );
}