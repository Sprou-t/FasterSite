import { ImageCard } from './ImageCard';
import type { Image } from '@/lib/schema';

interface ImageGridProps {
  images: Image[];
  className?: string;
}

export function ImageGrid({ images, className = '' }: ImageGridProps) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}>
      {images.map((image, index) => (
        <ImageCard
          key={image.id}
          image={image}
          index={index}
          priority={index < 6} // First 6 images get priority loading
        />
      ))}
    </div>
  );
}