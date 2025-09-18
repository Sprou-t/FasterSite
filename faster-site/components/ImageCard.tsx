import Image from 'next/image';
import { OptimizedLink } from './OptimizedLink';
import type { Image as ImageType } from '@/lib/schema';

interface ImageCardProps {
  image: ImageType;
  index: number;
  priority?: boolean;
}

export function ImageCard({ image, index, priority = false }: ImageCardProps) {
  // Strategic loading based on position (NextFaster technique)
  const isEager = index < 12; // First 12 images load eagerly
  const isPriority = priority && index < 6; // Only first 6 get priority

  // Strategic loading: first 6 get priority, first 12 are eager, rest are lazy

  return (
    <OptimizedLink
      href={`/image/${image.id}`}
      imageSrc={image.s3Url}
      className="group block rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="aspect-square relative overflow-hidden rounded-t-lg bg-gray-100">
        <Image
          src={image.s3Url}
          alt={image.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform group-hover:scale-105"
          loading={isEager ? "eager" : "lazy"}
          priority={isPriority}
          quality={isEager ? 80 : 65} // Higher quality for above-fold
        />
      </div>

      {/* Title below image */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
          {image.title}
        </h3>
      </div>
    </OptimizedLink>
  );
}