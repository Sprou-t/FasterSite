"use client";

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { OptimizedLink } from './OptimizedLink';
import type { Image as ImageType } from '@/lib/schema';

interface ImageCardProps {
  image: ImageType;
  index: number;
  priority?: boolean;
}

export function ImageCard({ image, index, priority = false }: ImageCardProps) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Calculate dynamic rootMargin based on card dimensions and grid layout
    const calculateRootMargin = () => {
      const screenWidth = window.innerWidth;

      // Determine grid columns based on Tailwind breakpoints
      let columns = 1;
      if (screenWidth >= 1280) columns = 4;      // xl
      else if (screenWidth >= 1024) columns = 3; // lg
      else if (screenWidth >= 640) columns = 2;  // sm

      // Calculate approximate card height
      // Card width = (container width - gaps) / columns
      const containerPadding = 48; // 24px padding on each side
      const gap = 24; // gap-6 = 24px
      const availableWidth = screenWidth - containerPadding - (gap * (columns - 1));
      const cardWidth = availableWidth / columns;

      // Card height = image (square) + title + padding
      const imageHeight = cardWidth; // aspect-square
      const titleHeight = 60; // approx height of title section
      const cardHeight = imageHeight + titleHeight;

      // Load 2 rows above and below current viewport
      const rowMargin = (cardHeight + gap) * 2;

      return `${Math.round(rowMargin)}px 0px ${Math.round(rowMargin)}px 0px`;
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: calculateRootMargin()
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Strategic loading based on viewport position
  const isEager = shouldLoad;
  const isPriority = shouldLoad && index < 6; // First 6 visible get priority
  const isHighQuality = index < 12; // First 12 images get higher quality

  return (
    <OptimizedLink
      href={`/image/${image.id}`}
      imageSrc={image.s3Url}
      className="group block rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
    >
      <div ref={cardRef} className="aspect-square relative overflow-hidden rounded-t-lg bg-gray-100">
        {shouldLoad ? (
          <Image
            src={image.s3Url}
            alt={image.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform group-hover:scale-105"
            loading={isEager ? "eager" : "lazy"}
            priority={isPriority}
            quality={isHighQuality ? 80 : 65} // Higher quality for first 12 images
          />
        ) : (
          // Placeholder while not in loading zone
          <div className="w-full h-full bg-gray-200 animate-pulse" />
        )}
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