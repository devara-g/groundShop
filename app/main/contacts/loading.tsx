export default function ContactsLoading() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="p-4 border-b bg-white">
        <div className="h-7 w-24 bg-gray-200 animate-pulse rounded" />
      </div>

      <div className="p-4 border-b bg-white">
        <div className="flex gap-2">
          <div className="flex-1 h-10 bg-gray-200 animate-pulse rounded-xl" />
          <div className="w-16 h-10 bg-gray-200 animate-pulse rounded-xl" />
        </div>
      </div>

      <div className="p-4 bg-white space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
            <div className="w-10 h-10 bg-gray-200 animate-pulse rounded-full" />
            <div className="h-4 w-28 bg-gray-200 animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}