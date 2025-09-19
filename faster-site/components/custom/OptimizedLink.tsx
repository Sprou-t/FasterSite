"use client";

import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface OptimizedLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  prefetchDistance?: number; // Distance in pixels to trigger prefetch
  imageSrc?: string; // S3 image URL to prefetch
  isBackButton?: boolean; // Identifies back navigation links for enhanced prefetching
}

export function OptimizedLink({
  href,
  children,
  className = "",
  prefetchDistance = 150, // Back to optimal distance
  imageSrc,
  isBackButton = false // New prop to identify back navigation links
}: OptimizedLinkProps) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const router = useRouter();
  const [isNearCursor, setIsNearCursor] = useState(false);
  const [prefetchedImages, setPrefetchedImages] = useState<Set<string>>(new Set());
  const [prefetchedRoutes, setPrefetchedRoutes] = useState<Set<string>>(new Set());

  // Global cache for deduplication (like NextFaster)
  const imageCache = useRef<Map<string, any>>(new Map());
  const seenImages = useRef<Set<string>>(new Set());

  // Helper function to prefetch images (with NextFaster deduplication)
  const prefetchImage = (src: string) => {
    if (seenImages.current.has(src)) {
      console.log(`🚫 Image already prefetched: ${src}`);
      return;
    }

    console.log(`🖼️ Prefetching image: ${src}`);
    const img = new Image();
    img.src = src;
    img.decoding = "async";
    img.fetchPriority = "low";

    seenImages.current.add(src); // Mark as seen (NextFaster pattern)
    setPrefetchedImages(prev => new Set(prev).add(src));
  };

  // Helper function to prefetch via API
  const prefetchViaAPI = async (targetHref: string) => {
    if (prefetchedRoutes.has(targetHref)) return;

    try {
      // Extract image ID from href (e.g., /image/123 -> 123)
      const imageIdMatch = targetHref.match(/\/image\/(\d+)/);
      if (imageIdMatch) {
        const imageId = imageIdMatch[1];
        console.log(`📡 API prefetching image ${imageId}`);

        // Call our prefetch API (no related images)
        const response = await fetch(`/api/prefetch-images?id=${imageId}&related=false`);
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ API prefetch successful:`, {
            mainImage: data.image?.title
          });

          // Prefetch the main image
          if (data.image?.s3Url) {
            prefetchImage(data.image.s3Url);
          }


          setPrefetchedRoutes(prev => new Set(prev).add(targetHref));
        } else {
          console.warn(`⚠️ API prefetch failed for ${targetHref}`);
        }
      }
    } catch (error) {
      console.error(`❌ API prefetch error for ${targetHref}:`, error);
    }
  };

  useEffect(() => {
    const linkElement = linkRef.current;
    if (!linkElement) return;

    let animationFrame: number;

    const handleMouseMove = (e: MouseEvent) => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }

      animationFrame = requestAnimationFrame(() => {
        const rect = linkElement.getBoundingClientRect();
        const distance = Math.sqrt(
          Math.pow(e.clientX - (rect.left + rect.width / 2), 2) +
          Math.pow(e.clientY - (rect.top + rect.height / 2), 2)
        );

        const wasNear = isNearCursor;
        const isNear = distance <= prefetchDistance;

        // Debug logging for distance (only in development)
        if (process.env.NODE_ENV === 'development' && distance <= prefetchDistance + 50) {
          console.log(`📏 Distance to ${href}: ${Math.round(distance)}px (threshold: ${prefetchDistance}px)`);
        }

        if (isNear && !wasNear) {
          setIsNearCursor(true);
          // Prefetch route when cursor gets near
          console.log(`🎯 Cursor within ${prefetchDistance}px: prefetching ${href}${isBackButton ? ' (BACK BUTTON)' : ''}`);
          console.log(`📏 Exact distance: ${Math.round(distance)}px`);

          // Visual feedback for development
          if (process.env.NODE_ENV === 'development') {
            linkElement.style.border = isBackButton ? '2px solid blue' : '2px solid green';
            setTimeout(() => {
              linkElement.style.border = '';
            }, 500);
          }

          // 1. Prefetch the route
          router.prefetch(href);

          // 2. Prefetch current image if provided
          if (imageSrc) {
            prefetchImage(imageSrc);
          }

          // 3. API prefetch for all links (back buttons already prefetched on page load)
          if (!isBackButton) {
            // Only prefetch if it's NOT a back button (back buttons use BackNavigationPreloader)
            prefetchViaAPI(href);
          } else {
            console.log(`🔄 Back button hover detected - skipping prefetch (already done on page load)`);
          }
        } else if (!isNear && wasNear) {
          setIsNearCursor(false);
          console.log(`❌ Cursor moved away from ${href} (distance: ${Math.round(distance)}px)`);
        }
      });
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [href, prefetchDistance, isNearCursor, router]);

  return (
    <NextLink
      ref={linkRef}
      href={href}
      prefetch={false} // We handle prefetching manually
      className={className}
      onMouseDown={(e) => {
        // Immediate navigation on mouse down (NextFaster technique)
        if (
          e.button === 0 &&
          !e.altKey &&
          !e.ctrlKey &&
          !e.metaKey &&
          !e.shiftKey
        ) {
          e.preventDefault();
          router.push(href);
        }
      }}
    >
      {children}
    </NextLink>
  );
}