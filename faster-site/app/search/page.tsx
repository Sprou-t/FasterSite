import { Suspense } from 'react';
import { searchImages } from '@/lib/queries';
import { ImageGrid } from '@/features/gallery/components/ImageGrid';
import { SearchBar } from '@/features/search/components/SearchBar';

// Loading skeleton for search results
function SearchResultsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

// Server component for search results
async function SearchResults({ query }: { query: string }) {
  console.log(`🔍 SearchResults component executing search for: "${query}"`);

  if (!query || query.trim().length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-4">
          Enter a search term to find images
        </div>
        <p className="text-gray-400">
          Try searching for terms like "nature", "architecture", or "technology"
        </p>
      </div>
    );
  }

  const results = await searchImages(query);

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-4">
          No images found for "{query}"
        </div>
        <p className="text-gray-400">
          Try a different search term or browse our categories
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Search Results for "{query}"
        </h2>
        <p className="text-gray-600">
          {results.length} {results.length === 1 ? 'image' : 'images'} found
        </p>
      </div>
      <ImageGrid images={results} />
    </div>
  );
}

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q || '';

  console.log(`🔍 Search page rendered with query: "${query}"`);

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Search Images
          </h1>

          {/* Dedicated search bar for search page */}
          <div className="max-w-2xl">
            <Suspense fallback={
              <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
            }>
              <SearchBar
                className="w-full"
                placeholder="Search for images, categories, or descriptions..."
              />
            </Suspense>
          </div>
        </div>

        {/* Search results with Suspense boundary */}
        <Suspense
          key={query} // Key ensures fresh loading state for new searches
          fallback={<SearchResultsSkeleton />}
        >
          <SearchResults query={query} />
        </Suspense>
      </div>
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q;

  if (query) {
    return {
      title: `Search: ${query} | FasterSite Gallery`,
      description: `Search results for "${query}" in our optimized image gallery`,
    };
  }

  return {
    title: 'Search Images | FasterSite Gallery',
    description: 'Search through our collection of high-quality images',
  };
}