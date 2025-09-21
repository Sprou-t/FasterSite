import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { OptimizedLink } from '@/components/custom/OptimizedLink'
import { getImageById, getAllImages } from '@/lib/queries'

interface ImagePageProps {
    params: Promise<{ id: string }>
}

function LoadingImageDetail() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="aspect-[4/3] bg-gray-200 rounded-lg mb-6"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
        </div>
    )
}

async function ImageDetail({ id }: { id: string }) {
    const image = await getImageById(id)

    if (!image) {
        notFound()
    }

    // Server-side logging for debugging
    console.log(`🎯 IMAGE PAGE: Loading image with FULL URL:`, image.imageUrl)

    return (
        <div className="max-w-6xl mx-auto p-6">
            {/* Back Link with OptimizedLink */}
            <OptimizedLink
                href="/"
                prefetch={false}
                className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
            >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Gallery
            </OptimizedLink>

            {/* Image and details - Left-Right Layout */}
            <div className="grid lg:grid-cols-2 gap-8">
                {/* Image - Left Side */}
                <div className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                        src={image.imageUrl}
                        alt={image.title}
                        fill
                        className="object-contain"
                        priority
                        quality={90}
                        sizes="(max-width: 768px) 100vw, 50vw"
                    />
                </div>

                {/* Details - Right Side */}
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
                                <dt className="font-medium text-gray-500">Photographer</dt>
                                <dd className="text-gray-900">{image.unsplashUserName || 'Unknown'}</dd>
                            </div>
                            <div>
                                <dt className="font-medium text-gray-500">Likes</dt>
                                <dd className="text-gray-900">{image.unsplashLikes || 0}</dd>
                            </div>
                            <div>
                                <dt className="font-medium text-gray-500">Category</dt>
                                <dd className="text-gray-900">{image.category.name}</dd>
                            </div>
                            <div>
                                <dt className="font-medium text-gray-500">Dimensions</dt>
                                <dd className="text-gray-900">{image.width} × {image.height}</dd>
                            </div>
                        </dl>
                    </div>

                    {/* Download Link */}
                    <div className="border-t pt-6">
                        <a
                            href={image.originalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            View at full size →
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default async function ImagePage({ params }: ImagePageProps) {
    const { id } = await params

    return (
        <main className="min-h-screen bg-white">
            {/* Image Detail */}
            <Suspense fallback={<LoadingImageDetail />}>
                <ImageDetail id={id} />
            </Suspense>
        </main>
    )
}

// Generate static params for all images (for better performance)
export async function generateStaticParams() {
    const images = await getAllImages()

    return images.map((image) => ({
        id: image.unsplashId,
    }))
}