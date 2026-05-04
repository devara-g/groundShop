export default function DashboardLoading() {
  return (
    <div className="flex h-screen">
      {/* Sidebar Skeleton */}
      <aside className="w-64 bg-white border-r p-4 space-y-4">
        <div className="h-8 w-32 bg-gray-200 animate-pulse rounded" />
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 animate-pulse rounded-lg" />
          ))}
        </div>
      </aside>

      {/* Main Content Skeleton */}
      <main className="flex-1 p-6 bg-gray-50">
        <div className="h-8 w-48 bg-gray-200 animate-pulse rounded mb-6" />
        
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-xl border space-y-2">
              <div className="h-4 w-20 bg-gray-200 animate-pulse rounded" />
              <div className="h-8 w-12 bg-gray-200 animate-pulse rounded" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-xl border space-y-3">
              <div className="h-12 w-12 bg-gray-200 animate-pulse rounded-xl" />
              <div className="h-5 w-24 bg-gray-200 animate-pulse rounded" />
              <div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}