export default function NotificationsLoading() {
  return (
    <div className="flex flex-col h-full bg-white md:rounded-3xl w-full border border-slate-100/50 shadow-sm animate-pulse">
      <div className="px-6 py-4 border-b border-slate-100 bg-white/90 sticky top-0 z-20">
        <div className="h-6 bg-slate-200 rounded-lg w-1/4"></div>
      </div>

      <div className="flex-1 w-full max-w-2xl mx-auto overflow-y-auto p-4 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-4 p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
            <div className="w-12 h-12 bg-slate-200 rounded-full shrink-0"></div>
            <div className="flex-1 space-y-2 py-1">
              <div className="flex justify-between items-center">
                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                <div className="h-3 bg-slate-200 rounded w-12"></div>
              </div>
              <div className="h-3 bg-slate-200 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
