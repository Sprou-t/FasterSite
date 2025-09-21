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
// seenImages tracks which images we've already prefetched
// imageCache tracks which images we've already cached
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
    const prefetchTimeout = useRef<NodeJS.Timeout | null>(null);

    // NextFaster's image prefetching function
    function prefetchImage(image: PrefetchImage) {
        if (image.loading === "lazy" || seenImages.has(image.srcset || image.src)) {
            return;
        }

        // Create image element and force browser to cache it
        const img = new Image();
        img.decoding = "async";
        img.fetchPriority = "low";

        // Add to seen set BEFORE loading to prevent duplicates (use srcset if available)
        seenImages.add(image.srcset || image.src);

        // Add load handlers to confirm caching
        img.onload = () => {
            console.log(`✅ NEXTFASTER: Successfully cached image ${image.src.substring(0, 50)}...`);
        };

        img.onerror = () => {
            console.log(`❌ NEXTFASTER: Failed to cache image ${image.src.substring(0, 50)}...`);
        };

        // Order is important: sizes must be set before srcset, srcset must be set before src
        if (image.sizes) img.sizes = image.sizes;
        if (image.srcset) img.srcset = image.srcset;
        if (image.src) img.src = image.src;

        console.log(`🖼️ NEXTFASTER: Starting prefetch for FULL URL:`, image.src);
    }

    // NextFaster's prefetchImages function using API route
    async function prefetchImages(href: string) {
        try {
            console.log(`📡 NEXTFASTER: Fetching image metadata for ${href}`);

            // Skip certain routes like NextFaster does
            if (!href.startsWith("/") || href === "/") {
                console.log(`⚠️ NEXTFASTER: Skipping prefetch for route: ${href}`);
                return [];
            }

            const response = await fetch(`/api/prefetch-images${href}`, {
                priority: "low",
            });

            // Only throw in dev (like NextFaster does)
            if (!response.ok && process.env.NODE_ENV === "development") {
                throw new Error("Failed to prefetch images");
            }
            if (!response.ok) {
                console.error(`❌ NEXTFASTER: API returned ${response.status} for ${href}`);
                return [];
            }

            const data = await response.json();
            return data.images || [];
        } catch (error) {
            console.error('Failed to fetch prefetch data:', error);
            return [];
        }
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
                    prefetchTimeout.current = setTimeout(async () => {
                        console.log(`🔍 NEXTFASTER VIEWPORT: Prefetching route ${href}`);
                        router.prefetch(href);

                        // Simulate sleep like NextFaster
                        await new Promise(resolve => setTimeout(resolve, 0));

                        if (!imageCache.has(href)) {
                            console.log(`📡 NEXTFASTER VIEWPORT: Fetching image metadata for ${href}`);
                            void prefetchImages(href).then((images) => {
                                // after prefetching image, cache it
                                imageCache.set(href, images);
                                console.log(`💾 NEXTFASTER: Cached ${images.length} image(s) metadata for ${href}`);

                                // CRITICAL: Actually prefetch the images, not just metadata
                                images.forEach(image => {
                                    prefetchImage(image);
                                });
                            }, console.error);
                        }

                        observer.unobserve(entry.target);
                    }, 300);
                } else if (prefetchTimeout.current) {
                    clearTimeout(prefetchTimeout.current);
                    prefetchTimeout.current = null;
                }
            },
            { rootMargin: "0px", threshold: 0.1 }
        );

        observer.observe(linkElement);

        return () => {
            observer.disconnect();
            if (prefetchTimeout.current) {
                clearTimeout(prefetchTimeout.current);
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