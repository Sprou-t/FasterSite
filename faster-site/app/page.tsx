import { Suspense } from 'react';
import { getCategories, getImages, getImageCount } from '@/lib/queries';
import { CategorySidebar } from '@/features/gallery/components/CategorySidebar';
import { ImageGrid } from '@/features/gallery/components/ImageGrid';
import { GalleryCacheWarmer } from '@/features/performance/components/GalleryCacheWarmer';
import { GalleryScrollRestoration } from '@/features/performance/components/GalleryScrollRestoration';

// Loading components for Suspense boundaries
function ImageGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="aspect-square loading-skeleton" />
      ))}
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
      <div className="p-6">
        <div className="h-6 loading-skeleton mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 loading-skeleton" />
          ))}
        </div>
      </div>
    </aside>
  );
}

// Server components with caching
async function ImageGridSection({ category }: { category?: string }) {
  const images = await getImages(category);
  return (
    <>
      <ImageGrid images={images} />
      {/* Scroll restoration for back navigation */}
      <GalleryScrollRestoration images={images} currentCategory={category} />
    </>
  );
}

async function SidebarSection({ currentCategory }: { currentCategory?: string }) {
  const categories = await getCategories();
  return (
    <CategorySidebar
      categories={categories}
      currentCategory={currentCategory}
    />
  );
}

async function StatsSection({ category }: { category?: string }) {
  const count = await getImageCount(category);
  return (
    <div className="mb-6">
      <p className="text-gray-600">
        {count} {count === 1 ? 'image' : 'images'}
        {category && ` in ${category}`}
      </p>
      {/* Cache warmer for gallery */}
      <GalleryCacheWarmer
        currentCategory={category}
        totalImages={count}
        currentPage={1}
        imagesPerLoad={20}
      />
    </div>
  );
}

interface HomePageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = await searchParams;
  const category = resolvedSearchParams.category;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar with Suspense boundary */}
      <Suspense fallback={<SidebarSkeleton />}>
        <SidebarSection currentCategory={category} />
      </Suspense>

      {/* Main content */}
      <div className="flex-1 p-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          {/* Stats section */}
          <Suspense fallback={<div className="h-6 w-32 loading-skeleton mb-6" />}>
            <StatsSection category={category} />
          </Suspense>

          {/* Image grid with Suspense boundary */}
          <Suspense fallback={<ImageGridSkeleton />}>
            <ImageGridSection category={category} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

// Generate static params for all categories (ISR optimization)
export async function generateStaticParams() {
  try {
    const categories = await getCategories();
    return [
      {}, // Root page
      ...categories.map((category) => ({
        searchParams: { category: category.slug },
      })),
    ];
  } catch {
    return [{}];
  }
}