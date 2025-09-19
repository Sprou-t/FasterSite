import { Suspense } from 'react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getImage, getImages, getCategories } from '@/lib/queries';
import { ViewFullSizeButton } from '@/components/ViewFullSizeButton';
import { OptimizedLink } from '@/components/custom/OptimizedLink';
import { BackNavigationPreloader } from '@/features/performance/components/BackNavigationPreloader';

interface ImagePageProps {
  params: Promise<{ id: string }>;
}

// Loading component
function ImageDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="h-8 w-24 loading-skeleton mb-6" />
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="aspect-[4/3] loading-skeleton" />
        <div className="space-y-4">
          <div className="h-8 loading-skeleton" />
          <div className="h-4 loading-skeleton" />
          <div className="h-20 loading-skeleton" />
        </div>
      </div>
    </div>
  );
}

// Server component for image details
async function ImageDetailSection({ id }: { id: number }) {
  const image = await getImage(id);

  if (!image) {
    notFound();
  }

  // Get category info for the image to determine back navigation
  const categories = await getCategories();
  const category = categories.find(cat => cat.id === image.categoryId);
  const backHref = category ? `/?category=${category.slug}` : '/';

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Enhanced back button with prefetching */}
      <OptimizedLink
        href={backHref}
        isBackButton={true}
        prefetchDistance={200} // Larger distance for back button
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Gallery
      </OptimizedLink>

      {/* Back navigation preloader with position awareness */}
      <BackNavigationPreloader
        categorySlug={category?.slug}
        currentImageId={image.id}
      />

      {/* Image and details */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
          <Image
            src={image.s3Url}
            alt={image.title}
            fill
            className="object-contain"
            priority
            quality={90}
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {image.title}
            </h1>
            {image.description && (
              <p className="text-gray-600 leading-relaxed">
                {image.description}
              </p>
            )}
          </div>

          {/* Metadata */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Image Details
            </h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="font-medium text-gray-500">Dimensions</dt>
                <dd className="text-gray-900">
                  {image.width} × {image.height}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">File Size</dt>
                <dd className="text-gray-900">
                  {Math.round((image.fileSize || 0) / 1024)} KB
                </dd>
              </div>
              {image.unsplashLikes !== null && (
                <div>
                  <dt className="font-medium text-gray-500">Likes</dt>
                  <dd className="text-gray-900">{image.unsplashLikes}</dd>
                </div>
              )}
              <div>
                <dt className="font-medium text-gray-500">Created</dt>
                <dd className="text-gray-900">
                  {new Date(image.createdAt!).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>

          {/* Download button (placeholder) */}
          <div className="border-t pt-6">
            <ViewFullSizeButton imageUrl={image.s3Url} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function ImagePage({ params }: ImagePageProps) {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id);

  if (isNaN(id)) {
    notFound();
  }

  return (
    <Suspense fallback={<ImageDetailSkeleton />}>
      <ImageDetailSection id={id} />
    </Suspense>
  );
}

// Generate static params for all images (ISR optimization)
export async function generateStaticParams() {
  try {
    const images = await getImages();
    return images.slice(0, 20).map((image) => ({
      id: image.id.toString(),
    }));
  } catch {
    return [];
  }
}

// Metadata for SEO
export async function generateMetadata({ params }: ImagePageProps) {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id);

  if (isNaN(id)) {
    return {
      title: 'Image Not Found',
    };
  }

  try {
    const image = await getImage(id);

    if (!image) {
      return {
        title: 'Image Not Found',
      };
    }

    return {
      title: `${image.title} - FasterSite Gallery`,
      description: image.description || `View ${image.title} in high quality`,
      openGraph: {
        title: image.title,
        description: image.description || '',
        images: [image.s3Url],
      },
    };
  } catch {
    return {
      title: 'Image Not Found',
    };
  }
}