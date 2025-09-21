'use client'

import Image from 'next/image'
import { OptimizedLink } from '@/components/custom/OptimizedLink'

interface ImageData {
  id: number
  title: string
  description: string | null
  imageUrl: string
  originalUrl: string
  width: number
  height: number
  unsplashId: string
  unsplashUserName: string | null
  unsplashLikes: number | null
  category: {
    id: number
    name: string
    slug: string
  }
}

interface ImageGridProps {
  images: ImageData[]
}

export function ImageGrid({ images }: ImageGridProps) {
  console.log('🖼️ ImageGrid: Received', images.length, 'images')
  console.log('🖼️ First image data:', images[0] ? {
    id: images[0].id,
    title: images[0].title,
    imageUrl: images[0].imageUrl,
    unsplashId: images[0].unsplashId,
    unsplashUserName: images[0].unsplashUserName,
    unsplashLikes: images[0].unsplashLikes
  } : 'No images')

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
      {images.map((image, index) => (
        <div key={image.id} className="group bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
          <OptimizedLink
            href={`/image/${image.unsplashId}`}
            className="block"
          >
            <div className="aspect-square relative overflow-hidden">
              <Image
                src={image.imageUrl}
                alt={image.title}
                fill
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                quality={80}
                priority={index < 4}
                loading={index < 8 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : index < 3 ? "high" : "auto"}
                onLoad={() => console.log(`🖼️ Image ${index} loaded (${index < 8 ? 'EAGER' : 'LAZY'})`)}
              />
            </div>
            <div className="p-3">
              <h3 className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                {image.title}
              </h3>
            </div>
          </OptimizedLink>
        </div>
      ))}
    </div>
  )
}