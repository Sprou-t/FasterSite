"use client";

import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

interface OptimizedLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  prefetch?: boolean;
}

// Global caches (shared across all OptimizedLink instances)
const seenImages = new Set<string>();
const imageCache = new Map<string, any[]>();

type PrefetchImage = {
  srcset: string;
  sizes: string;
  src: string;
  alt: string;
  loading: string;
};

export function OptimizedLink({
  href,
  children,
  className = "",
  prefetch = true,
}: OptimizedLinkProps) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const router = useRouter();
  let prefetchTimeout: NodeJS.Timeout | null = null;

  // NextFaster's image prefetching function
  function prefetchImage(image: PrefetchImage) {
    if (image.loading === "lazy" || seenImages.has(image.srcset)) {
      return;
    }
    const img = new Image();
    img.decoding = "async";
    img.fetchPriority = "low";
    img.sizes = image.sizes;
    seenImages.add(image.srcset);
    img.srcset = image.srcset;
    img.src = image.src;
    img.alt = image.alt;

    console.log(`🖼️ NEXTFASTER: Prefetched image ${image.src.substring(0, 50)}...`);
  }

  // Mock prefetchImages function (NextFaster uses API route)
  async function prefetchImages(href: string) {
    // In NextFaster, this calls /api/prefetch-images/[...rest]
    // For our demo, we'll simulate with the images we know exist
    console.log(`📡 NEXTFASTER: Fetching image metadata for ${href}`);
    return [
      {
        srcset: `/_next/image?url=${encodeURIComponent(`https://images.unsplash.com/photo-example`)}&w=256&q=80 1x`,
        sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
        src: `/_next/image?url=${encodeURIComponent(`https://images.unsplash.com/photo-example`)}&w=256&q=80`,
        alt: "Image",
        loading: "eager"
      }
    ];
  }

  // NextFaster's exact Intersection Observer implementation
  useEffect(() => {
    if (prefetch === false) return;

    const linkElement = linkRef.current;
    if (!linkElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          prefetchTimeout = setTimeout(async () => {
            console.log(`🔍 NEXTFASTER VIEWPORT: Prefetching route ${href}`);
            router.prefetch(href);

            // Simulate sleep like NextFaster
            await new Promise(resolve => setTimeout(resolve, 0));

            if (!imageCache.has(href)) {
              console.log(`📡 NEXTFASTER VIEWPORT: Fetching image metadata for ${href}`);
              void prefetchImages(href).then((images) => {
                imageCache.set(href, images);
                console.log(`💾 NEXTFASTER: Cached ${images.length} image(s) for ${href}`);
              }, console.error);
            }

            observer.unobserve(entry.target);
          }, 300);
        } else if (prefetchTimeout) {
          clearTimeout(prefetchTimeout);
          prefetchTimeout = null;
        }
      },
      { rootMargin: "0px", threshold: 0.1 }
    );

    observer.observe(linkElement);

    return () => {
      observer.disconnect();
      if (prefetchTimeout) {
        clearTimeout(prefetchTimeout);
      }
    };
  }, [href, prefetch, router]);


  return (
    <NextLink
      ref={linkRef}
      href={href}
      prefetch={false} // We handle prefetching manually
      className={className}
      onMouseEnter={() => {
        console.log(`💁 NEXTFASTER MOUSEENTER: Prefetching ${href}`);
        router.prefetch(href);
        const images = imageCache.get(href) || [];
        console.log(`🖼️ NEXTFASTER MOUSEENTER: Found ${images.length} cached images`);
        for (const image of images) {
          prefetchImage(image);
        }
      }}
      onMouseDown={(e) => {
        const url = new URL(href, window.location.href);
        if (
          url.origin === window.location.origin &&
          e.button === 0 &&
          !e.altKey &&
          !e.ctrlKey &&
          !e.metaKey &&
          !e.shiftKey
        ) {
          console.log(`⚡ NEXTFASTER MOUSEDOWN: Immediate navigation to ${href}`);
          e.preventDefault();
          router.push(href);
        }
      }}
    >
      {children}
    </NextLink>
  );
}