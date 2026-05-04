export default function FeedLoading() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="p-4 border-b bg-white">
        <div className="h-7 w-16 bg-gray-200 animate-pulse rounded" />
      </div>
      
      {/* Post form skeleton */}
      <div className="p-4 border-b bg-white space-y-3">
        <div className="h-20 w-full bg-gray-200 animate-pulse rounded-xl" />
        <div className="flex justify-end">
          <div className="h-10 w-20 bg-gray-200 animate-pulse rounded-full" />
        </div>
      </div>

      {/* Posts skeleton */}
      {[...Array(5)].map((_, i) => (
        <div key={i} className="p-4 border-b bg-white">
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-gray-200 animate-pulse rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 bg-gray-200 animate-pulse rounded" />
              <div className="h-4 w-full bg-gray-200 animate-pulse rounded" />
              <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}