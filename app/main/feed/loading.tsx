export default function FeedLoading() {
  return (
    <div className="flex flex-col h-full bg-white w-full border-x border-slate-100/50">
      {/* Header Skeleton */}
      <div className="px-6 py-4 border-b border-slate-100 bg-white/90 backdrop-blur-md sticky top-0 z-20 flex justify-between items-center">
        <div className="h-6 w-24 bg-slate-200 animate-pulse rounded" />
      </div>

      <div className="flex-1 w-full max-w-2xl mx-auto overflow-y-auto hide-scrollbar">
        {/* Post form skeleton */}
        <div className="p-6 border-b border-slate-100 bg-white space-y-3">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-slate-200 animate-pulse rounded-full shrink-0" />
            <div className="h-12 w-full bg-slate-100 animate-pulse rounded-2xl" />
          </div>
          <div className="flex justify-between items-center pt-2">
            <div className="h-8 w-8 bg-slate-100 animate-pulse rounded-full" />
            <div className="h-8 w-20 bg-slate-200 animate-pulse rounded-full" />
          </div>
        </div>

        {/* Posts skeleton */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-6 border-b border-slate-100 bg-white">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-slate-200 animate-pulse rounded-full shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-4 w-32 bg-slate-200 animate-pulse rounded" />
                <div className="h-3 w-full bg-slate-100 animate-pulse rounded" />
                <div className="h-3 w-5/6 bg-slate-100 animate-pulse rounded" />
                <div className="h-64 w-full bg-slate-50 animate-pulse rounded-2xl mt-3" />
                <div className="flex gap-4 mt-4">
                  <div className="h-6 w-12 bg-slate-100 animate-pulse rounded-full" />
                  <div className="h-6 w-12 bg-slate-100 animate-pulse rounded-full" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}