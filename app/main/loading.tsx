export default function DashboardLoading() {
  return (
    <div className="flex flex-col h-full bg-white w-full border-x border-slate-100/50">
      {/* Header Skeleton */}
      <div className="px-6 py-4 border-b border-slate-100 bg-white/90 backdrop-blur-md sticky top-0 z-20 flex justify-between items-center">
        <div className="h-6 w-32 bg-slate-200 animate-pulse rounded" />
      </div>

      <div className="flex-1 w-full max-w-2xl mx-auto overflow-y-auto p-6 space-y-8">
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-2">
              <div className="h-4 w-16 bg-slate-200 animate-pulse rounded" />
              <div className="h-8 w-12 bg-slate-200 animate-pulse rounded" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-3">
              <div className="h-12 w-12 bg-slate-200 animate-pulse rounded-xl" />
              <div className="h-4 w-20 bg-slate-200 animate-pulse rounded" />
              <div className="h-3 w-28 bg-slate-200 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}