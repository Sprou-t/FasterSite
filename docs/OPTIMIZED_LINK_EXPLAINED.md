# OptimizedLink Component - Line by Line Explanation

## File: `components/custom/OptimizedLink.tsx`

### Imports and Type Definitions (Lines 1-24)

```typescript
"use client"; // Line 1: Client component directive

import NextLink from "next/link";      // Line 3: Next.js Link component
import { useRouter } from "next/navigation"; // Line 4: Next.js router hook
import { useEffect, useRef } from "react";   // Line 5: React hooks

interface OptimizedLinkProps {  // Lines 7-12: Component props interface
    href: string;               // URL to navigate to
    children: React.ReactNode;  // Link content
    className?: string;         // Optional CSS classes
    prefetch?: boolean;         // Enable/disable prefetching
}

// Global caches (Lines 15-18)
const seenImages = new Set<string>();      // Track prefetched images globally
const imageCache = new Map<string, any[]>(); // Store image metadata per route

type PrefetchImage = {  // Lines 20-24: Image metadata structure
    srcset: string;     // Responsive image sources
    sizes: string;      // Size hints for browser
    src: string;        // Primary image source
    alt: string;        // Alt text
    loading: string;    // Loading strategy
};
```

### Component Function Start (Lines 26-34)

```typescript
export function OptimizedLink({
    href,                    // URL prop: "/image/abc123"
    children,               // JSX content inside the link
    className = "",         // CSS classes (default empty)
    prefetch = true,        // Prefetching enabled by default
}: OptimizedLinkProps) {
    const linkRef = useRef<HTMLAnchorElement>(null);  // DOM reference for intersection observer
    const router = useRouter();                       // Next.js navigation
    const prefetchTimeout = useRef<NodeJS.Timeout | null>(null); // Timer for 300ms delay
```

### Image Prefetching Function (Lines 37-67)

```typescript
// Function to cache individual images in browser
function prefetchImage(image: PrefetchImage) {
    // Line 38-40: Skip conditions
    if (image.loading === "lazy" || seenImages.has(image.srcset || image.src)) {
        return; // Don't prefetch lazy images or already cached images
    }

    // Line 43-45: Create new image element for caching
    const img = new Image();
    img.decoding = "async";      // Non-blocking decode
    img.fetchPriority = "low";   // Low priority network request

    // Line 50: Mark as seen BEFORE starting download (prevent duplicates)
    seenImages.add(image.srcset || image.src);

    // Line 53-59: Success and error handlers
    img.onload = () => {
        console.log(`✅ NEXTFASTER: Successfully cached image ${image.src.substring(0, 50)}...`);
    };

    img.onerror = () => {
        console.log(`❌ NEXTFASTER: Failed to cache image ${image.src.substring(0, 50)}...`);
    };

    // Line 62-64: Set image attributes in CRITICAL ORDER
    if (image.sizes) img.sizes = image.sizes;     // 1. Sizes first
    if (image.srcset) img.srcset = image.srcset;  // 2. Srcset second
    if (image.src) img.src = image.src;           // 3. Src last (triggers download)

    console.log(`🖼️ NEXTFASTER: Starting prefetch for FULL URL:`, image.src);
}
```

### API Communication Function (Lines 69-99)

```typescript
// Function to fetch image metadata from our API
async function prefetchImages(href: string) {
    try {
        console.log(`📡 NEXTFASTER: Fetching image metadata for ${href}`);

        // Line 75-77: Skip certain routes (like NextFaster does)
        if (!href.startsWith("/") || href === "/") {
            console.log(`⚠️ NEXTFASTER: Skipping prefetch for route: ${href}`);
            return [];
        }

        // Line 80-82: Make API call to our backend
        const response = await fetch(`/api/prefetch-images${href}`, {
            priority: "low", // Low priority network request
        });

        // Line 85-91: Error handling
        if (!response.ok && process.env.NODE_ENV === "development") {
            throw new Error("Failed to prefetch images"); // Only throw in dev
        }
        if (!response.ok) {
            console.error(`❌ NEXTFASTER: API returned ${response.status} for ${href}`);
            return [];
        }

        // Line 93-94: Parse and return image metadata
        const data = await response.json();
        return data.images || []; // Array of PrefetchImage objects
    } catch (error) {
        console.error('Failed to fetch prefetch data:', error);
        return [];
    }
}
```

### Intersection Observer Setup (Lines 102-151)

```typescript
// Main prefetching logic triggered by viewport visibility
useEffect(() => {
    if (prefetch === false) return; // Line 103: Respect prefetch prop

    const linkElement = linkRef.current;
    if (!linkElement) return; // Line 106: Ensure DOM element exists

    // Line 108-141: Create intersection observer
    const observer = new IntersectionObserver(
        (entries) => {
            const entry = entries[0]; // Get first (and only) entry

            if (entry.isIntersecting) { // Line 111: Element is in viewport
                // Line 112: Start 300ms timer
                prefetchTimeout.current = setTimeout(async () => {

                    // STEP 1: Prefetch JavaScript route
                    console.log(`🔍 NEXTFASTER VIEWPORT: Prefetching route ${href}`);
                    router.prefetch(href); // Downloads JS bundles

                    // Line 117: Artificial delay (like NextFaster)
                    await new Promise(resolve => setTimeout(resolve, 0));

                    // STEP 2: Check if we already have image metadata
                    if (!imageCache.has(href)) {
                        console.log(`📡 NEXTFASTER VIEWPORT: Fetching image metadata for ${href}`);

                        // STEP 3: Fetch image metadata and cache images
                        void prefetchImages(href).then((images) => {
                            // Store metadata in global cache
                            imageCache.set(href, images);
                            console.log(`💾 NEXTFASTER: Cached ${images.length} image(s) metadata for ${href}`);

                            // STEP 4: Cache each individual image
                            images.forEach(image => {
                                prefetchImage(image); // Triggers browser caching
                            });
                        }, console.error);
                    }

                    // Line 133: Stop observing after prefetching
                    observer.unobserve(entry.target);
                }, 300); // 300ms delay

            } else if (prefetchTimeout.current) {
                // Line 135-137: Cancel timer if element leaves viewport
                clearTimeout(prefetchTimeout.current);
                prefetchTimeout.current = null;
            }
        },
        {
            rootMargin: "0px",    // No margin around viewport
            threshold: 0.1        // Trigger when 10% visible
        }
    );

    // Line 143: Start observing the link element
    observer.observe(linkElement);

    // Line 145-151: Cleanup function
    return () => {
        observer.disconnect(); // Stop observing
        if (prefetchTimeout.current) {
            clearTimeout(prefetchTimeout.current); // Cancel pending timer
        }
    };
}, [href, prefetch, router]); // Re-run if these values change

**Dependency Array Explanation**:
- **`href`**: When the URL changes (e.g., `/image/abc123` → `/image/xyz789`), the old intersection observer is cleaned up and a new one is created for the new URL
- **`prefetch`**: When prefetch setting changes (e.g., `true` → `false`), the effect re-runs to enable/disable prefetching
- **`router`**: When router instance changes (rare), ensures we use the current router for prefetching

**What happens on dependency change**:
1. Cleanup function runs: `observer.disconnect()` and `clearTimeout()`
2. useEffect runs again with new values
3. New intersection observer created with updated parameters
```

### JSX Render (Lines 154-187)

```typescript
return (
    <NextLink
        ref={linkRef}           // Line 156: DOM reference for intersection observer
        href={href}             // Line 157: Navigation URL
        prefetch={false}        // Line 158: Disable Next.js default prefetching
        className={className}   // Line 159: CSS classes

        // Mouse hover prefetching
        onMouseEnter={() => {   // Line 160-168
            console.log(`💁 NEXTFASTER MOUSEENTER: Prefetching ${href}`);
            router.prefetch(href); // Re-prefetch route (redundant but harmless)

            const images = imageCache.get(href) || []; // Get cached metadata
            console.log(`🖼️ NEXTFASTER MOUSEENTER: Found ${images.length} cached images`);

            for (const image of images) {
                prefetchImage(image); // Re-cache images (deduplication prevents waste)
            }
        }}

        // Instant navigation on mouse down
        onMouseDown={(e) => {   // Line 169-182
            const url = new URL(href, window.location.href);

            // Check if it's a normal left-click to same origin
            if (
                url.origin === window.location.origin &&
                e.button === 0 &&      // Left click
                !e.altKey &&           // No modifier keys
                !e.ctrlKey &&
                !e.metaKey &&
                !e.shiftKey
            ) {
                console.log(`⚡ NEXTFASTER MOUSEDOWN: Immediate navigation to ${href}`);
                e.preventDefault();    // Prevent default link behavior
                router.push(href);     // Instant navigation using Next.js router
            }
        }}
    >
        {children}              // Line 184: Render link content
    </NextLink>
);
```

## Key Data Flow

### Global Variables
```typescript
seenImages: Set<string>
// Stores: ["/_next/image?url=...&w=480&q=90", "/_next/image?url=...&w=640&q=90", ...]
// Purpose: Prevent duplicate image downloads

imageCache: Map<string, PrefetchImage[]>
// Key: "/image/abc123"
// Value: [{ src: "/_next/image?url=...", srcset: "...", sizes: "..." }]
// Purpose: Store image metadata per route
```

### Event Sequence
1. **Component Mount**: Intersection observer starts watching
2. **Viewport Entry**: 300ms timer starts
3. **Timer Expires**: Route prefetch + API call + image caching
4. **Mouse Hover**: Redundant prefetching (fast due to caches)
5. **Mouse Down**: Instant navigation with cached resources

### Why This Works
- **Perfect timing**: Prefetching starts before user intends to click
- **Exact URLs**: Server-side HTML parsing gets real Next.js URLs
- **Deduplication**: Global caches prevent wasteful duplicate downloads
- **Instant navigation**: Both JS and images are pre-cached