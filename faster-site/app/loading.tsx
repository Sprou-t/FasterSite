export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center space-y-4">
        {/* Spinner */}
        <div className="relative">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-blue-400 rounded-full animate-spin animation-delay-150"></div>
        </div>

        {/* Loading text */}
        <div className="text-center">
          <p className="text-gray-600 font-medium">Loading...</p>
          <p className="text-sm text-gray-400 mt-1">Fetching your images</p>
        </div>
      </div>
    </div>
  );
}