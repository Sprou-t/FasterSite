"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface BackNavigationPreloaderProps {
  categorySlug?: string;
  currentImageId?: number; // The ID of the current image we're viewing
}

export function BackNavigationPreloader({ categorySlug, currentImageId }: BackNavigationPreloaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPrefetched, setIsPrefetched] = useState(false);

  useEffect(() => {
    // Only run on image detail pages
    if (!pathname.startsWith('/image/') || isPrefetched) return;

    console.log('🔄 BackNavigationPreloader: Detected image detail page');

    // Function to prefetch gallery page and images
    const prefetchGallery = async () => {
      try {
        // 1. Prefetch the gallery route
        const galleryUrl = categorySlug ? `/?category=${categorySlug}` : '/';
        console.log(`📡 Prefetching gallery route: ${galleryUrl}`);
        router.prefetch(galleryUrl);

        // 2. Prefetch gallery images via API (position-aware)
        console.log(`🖼️ Prefetching gallery images for back navigation (image ID: ${currentImageId})`);
        const apiUrl = categorySlug
          ? `/api/prefetch-images?category=${categorySlug}`
          : '/api/prefetch-images';

        const response = await fetch(apiUrl);
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Gallery prefetch successful: ${data.images?.length} images`);

          // 3. Position-aware image prefetching
          if (data.images && currentImageId) {
            // Find the position of current image in the gallery
            const currentImageIndex = data.images.findIndex((img: any) => img.id === currentImageId);

            if (currentImageIndex >= 0) {
              // Prefetch images around the current position (±7 images = 15 total)
              const prefetchRadius = 7;
              const startIndex = Math.max(0, currentImageIndex - prefetchRadius);
              const endIndex = Math.min(data.images.length, currentImageIndex + prefetchRadius + 1);
              const imagesToPrefetch = data.images.slice(startIndex, endIndex);

              console.log(`📍 Current image at position ${currentImageIndex + 1}/${data.images.length}`);
              console.log(`🎯 Prefetching ${imagesToPrefetch.length} images around position (${startIndex + 1}-${endIndex})`);

              // Store position info for scroll restoration
              sessionStorage.setItem('gallery_return_position', currentImageIndex.toString());
              sessionStorage.setItem('gallery_return_image_id', currentImageId.toString());

              imagesToPrefetch.forEach((image: any, index: number) => {
                setTimeout(() => {
                  const img = new Image();
                  img.src = image.s3Url;
                  img.loading = 'lazy';
                  img.decoding = 'async';
                  console.log(`🖼️ Preloaded gallery image ${startIndex + index + 1}: ${image.title}`);
                }, index * 50);
              });
            } else {
              // Fallback: prefetch first 8 images if position not found
              console.log(`⚠️ Current image not found in gallery, falling back to first 8 images`);
              data.images.slice(0, 8).forEach((image: any, index: number) => {
                setTimeout(() => {
                  const img = new Image();
                  img.src = image.s3Url;
                  img.loading = 'lazy';
                  img.decoding = 'async';
                  console.log(`🖼️ Preloaded gallery image ${index + 1}: ${image.title}`);
                }, index * 50);
              });
            }
          } else {
            // Fallback: prefetch first 8 images if no currentImageId provided
            console.log(`📍 No current image ID provided, prefetching first 8 images`);
            if (data.images) {
              data.images.slice(0, 8).forEach((image: any, index: number) => {
                setTimeout(() => {
                  const img = new Image();
                  img.src = image.s3Url;
                  img.loading = 'lazy';
                  img.decoding = 'async';
                  console.log(`🖼️ Preloaded gallery image ${index + 1}: ${image.title}`);
                }, index * 50);
              });
            }
          }

          setIsPrefetched(true);
          console.log(`🎯 Back navigation cache warming complete for ${categorySlug || 'all images'}`);
        }
      } catch (error) {
        console.error('❌ Gallery prefetch failed:', error);
      }
    };

    // Start prefetching after a short delay to not interfere with current page load
    const timeout = setTimeout(prefetchGallery, 500);

    return () => clearTimeout(timeout);
  }, [pathname, router, categorySlug, isPrefetched]);

  // This component doesn't render anything visible
  return null;
}