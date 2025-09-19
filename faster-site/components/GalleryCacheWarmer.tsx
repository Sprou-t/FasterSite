"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface GalleryCacheWarmerProps {
  currentCategory?: string;
  totalImages: number;
  currentPage?: number;
  imagesPerLoad?: number;
}

export function GalleryCacheWarmer({
  currentCategory,
  totalImages,
  currentPage = 1,
  imagesPerLoad = 20
}: GalleryCacheWarmerProps) {
  const router = useRouter();
  const [warmedPages, setWarmedPages] = useState<Set<number>>(new Set());
  const [warmedCategories, setWarmedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Calculate total pages
    const totalPages = Math.ceil(totalImages / imagesPerLoad);

    // Function to warm next page of images
    const warmNextPage = async () => {
      const nextPage = currentPage + 1;

      if (nextPage <= totalPages && !warmedPages.has(nextPage)) {
        console.log(`🔥 Cache warming: Prefetching page ${nextPage} of ${totalPages}`);

        try {
          // Prefetch next batch of images
          const apiUrl = currentCategory
            ? `/api/prefetch-images?category=${currentCategory}&page=${nextPage}`
            : `/api/prefetch-images?page=${nextPage}`;

          const response = await fetch(apiUrl);
          if (response.ok) {
            const data = await response.json();

            if (data.images && data.images.length > 0) {
              // Preload images with low priority to avoid blocking current page
              data.images.forEach((image: any, index: number) => {
                setTimeout(() => {
                  const img = new Image();
                  img.src = image.s3Url;
                  img.loading = 'lazy';
                  img.decoding = 'async';
                  // Use lower quality for prefetched images
                  if (image.s3Url.includes('?')) {
                    img.src = image.s3Url + '&q=60';
                  }
                }, index * 100); // Stagger loads more to avoid overwhelming
              });

              console.log(`✅ Cache warmed: ${data.images.length} images from page ${nextPage}`);
              setWarmedPages(prev => new Set(prev).add(nextPage));
            }
          }
        } catch (error) {
          console.warn(`⚠️ Cache warming failed for page ${nextPage}:`, error);
        }
      }
    };

    // Function to warm other categories
    const warmOtherCategories = async () => {
      try {
        console.log('🔥 Cache warming: Prefetching other categories');

        // Get categories list
        const categoriesResponse = await fetch('/api/prefetch-images?type=categories');
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();

          if (categoriesData.categories) {
            // Warm 2-3 other popular categories
            const otherCategories = categoriesData.categories
              .filter((cat: any) => cat.slug !== currentCategory)
              .slice(0, 3);

            for (const category of otherCategories) {
              if (!warmedCategories.has(category.slug)) {
                setTimeout(async () => {
                  try {
                    const response = await fetch(`/api/prefetch-images?category=${category.slug}`);
                    if (response.ok) {
                      const data = await response.json();

                      // Preload first 4 images from each category
                      if (data.images) {
                        data.images.slice(0, 4).forEach((image: any, index: number) => {
                          setTimeout(() => {
                            const img = new Image();
                            img.src = image.s3Url;
                            img.loading = 'lazy';
                            img.decoding = 'async';
                          }, index * 150);
                        });

                        console.log(`✅ Cache warmed category "${category.name}": ${Math.min(data.images.length, 4)} images`);
                        setWarmedCategories(prev => new Set(prev).add(category.slug));
                      }
                    }
                  } catch (error) {
                    console.warn(`⚠️ Category cache warming failed for ${category.slug}:`, error);
                  }
                }, Math.random() * 2000); // Random delay to spread load
              }
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ Categories cache warming failed:', error);
      }
    };

    // Start cache warming after page is fully loaded
    const startCacheWarming = () => {
      // Warm next page after 2 seconds
      setTimeout(warmNextPage, 2000);

      // Warm other categories after 5 seconds
      setTimeout(warmOtherCategories, 5000);
    };

    // Only run cache warming if we're on the first page and have more content
    if (currentPage === 1 && totalPages > 1) {
      startCacheWarming();
    }

  }, [currentCategory, currentPage, totalImages, imagesPerLoad, warmedPages, warmedCategories, router]);

  // This component doesn't render anything visible
  return null;
}