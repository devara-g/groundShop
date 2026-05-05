export default function ContactsLoading() {
  return (
    <div className="flex flex-col h-full bg-white w-full border-x border-slate-100/50">
      <div className="px-6 py-4 border-b border-slate-100 bg-white/90 backdrop-blur-md sticky top-0 z-20 flex justify-between items-center">
        <div className="h-6 w-24 bg-slate-200 animate-pulse rounded" />
      </div>

      <div className="flex-1 w-full max-w-2xl mx-auto overflow-y-auto p-6 space-y-8 hide-scrollbar">
        <div className="flex flex-col gap-8">
          <div className="space-y-4">
            <div className="h-6 w-32 bg-slate-200 animate-pulse rounded mb-4" />
            <div className="h-12 w-full bg-slate-100 animate-pulse rounded-2xl" />
          </div>

          <div className="space-y-4">
            <div className="h-6 w-40 bg-slate-200 animate-pulse rounded mb-4" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border border-slate-100 rounded-2xl">
                <div className="w-12 h-12 bg-slate-200 animate-pulse rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-slate-200 animate-pulse rounded" />
                  <div className="h-3 w-16 bg-slate-100 animate-pulse rounded" />
                </div>
                <div className="h-8 w-20 bg-slate-200 animate-pulse rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}