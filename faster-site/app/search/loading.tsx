export default function SearchLoading() {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page header skeleton */}
        <div className="mb-8">
          <div className="h-9 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div className="max-w-2xl">
            <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Search results skeleton */}
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            {/* Spinner */}
            <div className="relative">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-8 h-8 border-4 border-transparent border-t-blue-400 rounded-full animate-spin animation-delay-150"></div>
            </div>

            {/* Loading text */}
            <div className="text-center">
              <p className="text-gray-600 font-medium">Searching...</p>
              <p className="text-sm text-gray-400 mt-1">Finding relevant images</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}