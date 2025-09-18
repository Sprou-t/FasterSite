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
}

export function OptimizedLink({
  href,
  children,
  className = "",
  prefetchDistance = 150,
  imageSrc
}: OptimizedLinkProps) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const router = useRouter();
  const [isNearCursor, setIsNearCursor] = useState(false);
  const [prefetchedImages, setPrefetchedImages] = useState<Set<string>>(new Set());

  // Helper function to prefetch images
  const prefetchImage = (src: string) => {
    if (prefetchedImages.has(src)) return;

    console.log(`🖼️ Prefetching image: ${src}`);
    const img = new Image();
    img.src = src;
    setPrefetchedImages(prev => new Set(prev).add(src));
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

        if (isNear && !wasNear) {
          setIsNearCursor(true);
          // Prefetch route when cursor gets near
          console.log(`🎯 Cursor within 150px: prefetching ${href}`);
          console.log(`📏 Distance: ${Math.round(distance)}px`);
          router.prefetch(href);

          // Also prefetch image if provided
          if (imageSrc) {
            prefetchImage(imageSrc);
          }
        } else if (!isNear && wasNear) {
          setIsNearCursor(false);
          console.log(`❌ Cursor moved away from ${href}`);
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
      onMouseEnter={() => {
        // Immediate prefetch on hover
        console.log(`🔥 HOVER: Immediately prefetching ${href}`);
        router.prefetch(href);

        // Also prefetch image on hover
        if (imageSrc) {
          prefetchImage(imageSrc);
        }
      }}
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