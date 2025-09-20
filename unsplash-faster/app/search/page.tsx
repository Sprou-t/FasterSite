import { Suspense } from 'react'
import Link from 'next/link'
import { searchImages } from '@/lib/queries'
import { ImageGrid } from '@/features/gallery/components/ImageGrid'
import { SearchBar } from '@/features/search/components/SearchBar'

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

function LoadingResults() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="aspect-[4/3] bg-gray-200 rounded-lg animate-pulse" />
      ))}
    </div>
  )
}

async function SearchResults({ query }: { query: string }) {
  if (!query || query.trim().length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Enter a search term to find images</p>
      </div>
    )
  }

  const results = await searchImages(query)

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">No results found</h2>
        <p className="text-gray-500 mb-4">Try searching for something else</p>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          ← Browse all images
        </Link>
      </div>
    )
  }

  // Convert Image[] to ImageWithCategory[] for consistency
  const imagesWithCategory = results.map(image => ({
    ...image,
    category: {
      id: 0,
      name: 'Search Result',
      slug: 'search'
    }
  }))

  return (
    <div>
      <div className="px-6 py-4 border-b border-gray-200">
        <p className="text-sm text-gray-600">
          Found <strong>{results.length}</strong> result{results.length !== 1 ? 's' : ''} for &quot;<strong>{query}</strong>&quot;
        </p>
      </div>
      <ImageGrid images={imagesWithCategory} />
    </div>
  )
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q: query = '' } = await searchParams

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-gray-700">
              UnsplashFaster
            </Link>
            <div className="flex-1 max-w-lg mx-8">
              <SearchBar placeholder="Search images..." />
            </div>
            <p className="text-sm text-gray-500">NextFaster Search</p>
          </div>
        </div>
      </header>

      {/* Search Results */}
      <Suspense fallback={<LoadingResults />}>
        <SearchResults query={query} />
      </Suspense>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-500">
            <p>Powered by NextFaster optimization techniques</p>
            <p className="mt-1">Images from Unsplash • Built with Next.js 15</p>
          </div>
        </div>
      </footer>
    </main>
  )
}