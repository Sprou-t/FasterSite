"use client";

import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface OptimizedLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  prefetchDistance?: number; // Distance in pixels to trigger prefetch
}

export function OptimizedLink({
  href,
  children,
  className = "",
  prefetchDistance = 150
}: OptimizedLinkProps) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const router = useRouter();
  const [isNearCursor, setIsNearCursor] = useState(false);

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
          router.prefetch(href);
        } else if (!isNear && wasNear) {
          setIsNearCursor(false);
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
        router.prefetch(href);
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