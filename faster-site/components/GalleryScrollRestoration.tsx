"use client";

import { useEffect, useRef } from 'react';
import type { Image } from '@/lib/schema';

interface GalleryScrollRestorationProps {
  images: Image[];
  currentCategory?: string;
}

export function GalleryScrollRestoration({ images, currentCategory }: GalleryScrollRestorationProps) {
  const hasRestoredRef = useRef(false);

  useEffect(() => {
    // Only run once when component mounts
    if (hasRestoredRef.current) return;

    const restoreScrollPosition = () => {
      try {
        const returnPosition = sessionStorage.getItem('gallery_return_position');
        const returnImageId = sessionStorage.getItem('gallery_return_image_id');

        if (returnPosition && returnImageId) {
          const imageId = parseInt(returnImageId);
          const position = parseInt(returnPosition);

          console.log(`🔄 Restoring scroll to position ${position + 1} (image ID: ${imageId})`);

          // Verify the image still exists at expected position
          const imageAtPosition = images[position];
          if (imageAtPosition && imageAtPosition.id === imageId) {
            console.log(`✅ Image ID ${imageId} found at expected position ${position + 1}`);

            // Calculate scroll position based on image grid
            // Each row has up to 4 images (xl:grid-cols-4)
            const imagesPerRow = 4;
            const targetRow = Math.floor(position / imagesPerRow);

            // Estimate card height: aspect-square + title + padding
            // Based on Tailwind classes: aspect-square + p-3 title + gap-6
            const cardHeight = 280; // Approximate height including title
            const gap = 24; // gap-6 = 24px
            const headerHeight = 120; // Approximate header height

            const scrollY = headerHeight + (targetRow * (cardHeight + gap));

            console.log(`📏 Scrolling to row ${targetRow + 1}, Y position: ${scrollY}px`);

            // Smooth scroll to position
            window.scrollTo({
              top: scrollY,
              behavior: 'smooth'
            });

            // Clear the stored position after use
            sessionStorage.removeItem('gallery_return_position');
            sessionStorage.removeItem('gallery_return_image_id');

            console.log(`🎯 Scroll restoration complete`);
          } else {
            // Image moved or doesn't exist, try to find it
            const actualIndex = images.findIndex(img => img.id === imageId);
            if (actualIndex >= 0) {
              console.log(`⚠️ Image moved from position ${position + 1} to ${actualIndex + 1}`);

              const imagesPerRow = 4;
              const targetRow = Math.floor(actualIndex / imagesPerRow);
              const cardHeight = 280;
              const gap = 24;
              const headerHeight = 120;
              const scrollY = headerHeight + (targetRow * (cardHeight + gap));

              window.scrollTo({
                top: scrollY,
                behavior: 'smooth'
              });

              sessionStorage.removeItem('gallery_return_position');
              sessionStorage.removeItem('gallery_return_image_id');
            } else {
              console.log(`❌ Image ID ${imageId} not found in current gallery`);
              // Clear invalid data
              sessionStorage.removeItem('gallery_return_position');
              sessionStorage.removeItem('gallery_return_image_id');
            }
          }
        }
      } catch (error) {
        console.error('❌ Scroll restoration failed:', error);
        // Clear potentially corrupted data
        sessionStorage.removeItem('gallery_return_position');
        sessionStorage.removeItem('gallery_return_image_id');
      }

      hasRestoredRef.current = true;
    };

    // Delay restoration to ensure DOM is ready and images are loading
    const timeout = setTimeout(restoreScrollPosition, 100);

    return () => clearTimeout(timeout);
  }, [images, currentCategory]);

  // This component doesn't render anything visible
  return null;
}