# Performance Optimization Implementation Guide

This document provides detailed code examples and implementation details for all performance optimization techniques used in FasterSite.

## 🚀 Next.js 15 Experimental Features

### **Partial Prerendering (PPR) + React Compiler**
*File: `next.config.js`*

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        ppr: true,           // Partial Prerendering - static shells from edge
        inlineCss: true,     // Eliminates render-blocking CSS
        reactCompiler: true, // Automatic component optimization
    },
    // Image optimization settings
    images: {
        minimumCacheTTL: process.env.NODE_ENV === 'development' ? 0 : 31536000,  // 1 year cache
        formats: ['image/webp', 'image/avif'],
        qualities: [50, 65, 75, 80, 90, 95],
    },
};
```

**What this enables:**
- **PPR**: Static shells served from edge (~20-50ms) while dynamic content streams
- **React Compiler**: Automatic memoization without manual `useMemo`/`useCallback`
- **CSS Inlining**: Critical CSS embedded in HTML, eliminating render-blocking requests

---

## 🏗️ Advanced Caching Architecture

### **Multi-Layer Cache Wrapper**
*File: `lib/cache.ts`*

```typescript
import { unstable_cache as next_unstable_cache } from "next/cache";
import { cache } from "react";

// NextFaster's cache wrapper - combines Next.js cache with React cache for deduplication
export const unstable_cache = <Inputs extends unknown[], Output>(
  callback: (...args: Inputs) => Promise<Output>,
  key: string[],
  options: { revalidate: number },
) => cache(next_unstable_cache(callback, key, options));
```

**Benefits:**
- **Request-level deduplication**: React `cache()` prevents duplicate requests within same render
- **Cross-request caching**: Next.js `unstable_cache` persists across requests
- **Smart invalidation**: Time-based revalidation with custom keys

### **Database Query Caching**
*File: `lib/queries.ts`*

```typescript
export const getImages = unstable_cache(
    async (categorySlug?: string): Promise<Image[]> => {
        console.log(`🔍 Fetching images from database${categorySlug ? ` for category: ${categorySlug}` : ' (all images)'}...`);

        let dbImages: Image[];
        if (!categorySlug) {
            dbImages = await db.select().from(images);
        } else {
            const categoryResults = await db.select().from(categories).where(eq(categories.slug, categorySlug));
            if (categoryResults.length === 0) return [];

            const category = categoryResults[0];
            dbImages = await db.select().from(images).where(eq(images.categoryId, category.id));
        }

        // Generate secure URLs for all images
        return await addSecureUrls(dbImages);
    },
    (categorySlug?: string) => ['images', categorySlug || 'all', 'v2'], // Dynamic cache key
    {
        revalidate: 60 * 60 * 2, // 2 hours
    }
);
```

### **S3 URL Caching (48-hour cache)**
*File: `lib/queries.ts`*

```typescript
// In-memory cache for signed URLs
const urlCache = new Map<string, { url: string; expires: number }>();

async function getCachedSecureUrl(s3Key: string): Promise<string> {
    const cached = urlCache.get(s3Key);

    if (cached && cached.expires > Date.now()) {
        const hoursRemaining = Math.round((cached.expires - Date.now()) / 1000 / 60 / 60);
        console.log(`🚀 Cache hit for ${s3Key} (${hoursRemaining}h remaining)`);
        return cached.url;
    }

    console.log(`🔐 Generating 48h signed URL for ${s3Key}`);
    const newUrl = await s3Client.getSecureImageUrl(s3Key, URL_EXPIRES_IN);

    urlCache.set(s3Key, {
        url: newUrl,
        expires: Date.now() + (CACHE_EXPIRES_IN * 1000)
    });

    return newUrl;
}
```

---

## 🖼️ Intelligent Image Loading

### **Position-Aware Intersection Observer**
*File: `components/ImageCard.tsx`*

```typescript
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
      { rootMargin: calculateRootMargin() }
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
    <OptimizedLink href={`/image/${image.id}`} imageSrc={image.s3Url}>
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
          <div className="w-full h-full bg-gray-200 animate-pulse" />
        )}
      </div>
    </OptimizedLink>
  );
}
```

**Key optimizations:**
- **Dynamic rootMargin**: Calculates optimal prefetch distance based on screen size
- **Strategic loading**: First 6 get priority, first 12 get higher quality
- **Responsive calculation**: Adapts to different grid layouts (1-4 columns)

---

## 🎯 Smart Prefetching System

### **Mouse Proximity Prefetching**
*File: `components/OptimizedLink.tsx`*

```typescript
export function OptimizedLink({
  href,
  children,
  prefetchDistance = 150,
  isBackButton = false
}: OptimizedLinkProps) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const router = useRouter();
  const seenImages = useRef<Set<string>>(new Set());

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
          console.log(`🎯 Cursor within ${prefetchDistance}px: prefetching ${href}`);

          // 1. Prefetch the route
          router.prefetch(href);

          // 2. Prefetch current image if provided
          if (imageSrc) {
            prefetchImage(imageSrc);
          }

          // 3. API prefetch for non-back buttons only
          if (!isBackButton) {
            prefetchViaAPI(href);
          }
        }
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [href, prefetchDistance, router]);

  // Helper function to prefetch images (with deduplication)
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
  };

  return (
    <NextLink
      ref={linkRef}
      href={href}
      prefetch={false} // We handle prefetching manually
      onMouseDown={(e) => {
        // Immediate navigation on mouse down (NextFaster technique)
        if (e.button === 0 && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
          e.preventDefault();
          router.push(href);
        }
      }}
    >
      {children}
    </NextLink>
  );
}
```

### **Position-Aware Back Navigation Prefetching**
*File: `components/BackNavigationPreloader.tsx`*

```typescript
export function BackNavigationPreloader({ categorySlug, currentImageId }: BackNavigationPreloaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPrefetched, setIsPrefetched] = useState(false);

  useEffect(() => {
    // Only run on image detail pages
    if (!pathname.startsWith('/image/') || isPrefetched) return;

    const prefetchGallery = async () => {
      try {
        // 1. Prefetch the gallery route
        const galleryUrl = categorySlug ? `/?category=${categorySlug}` : '/';
        router.prefetch(galleryUrl);

        // 2. Get gallery images
        const apiUrl = categorySlug
          ? `/api/prefetch-images?category=${categorySlug}`
          : '/api/prefetch-images';

        const response = await fetch(apiUrl);
        if (response.ok) {
          const data = await response.json();

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
                }, index * 50); // Stagger loads to avoid overwhelming
              });
            }
          }

          setIsPrefetched(true);
        }
      } catch (error) {
        console.error('❌ Gallery prefetch failed:', error);
      }
    };

    // Start prefetching after a short delay to not interfere with current page load
    const timeout = setTimeout(prefetchGallery, 500);
    return () => clearTimeout(timeout);
  }, [pathname, router, categorySlug, currentImageId, isPrefetched]);

  return null;
}
```

**Key features:**
- **Position detection**: Finds current image position in gallery array
- **Smart radius**: Prefetches ±7 images around current position
- **Session storage**: Stores position for scroll restoration
- **Staggered loading**: 50ms delays to prevent overwhelming the browser

---

## 📍 Scroll Restoration

### **Gallery Position Memory**
*File: `components/GalleryScrollRestoration.tsx`*

```typescript
export function GalleryScrollRestoration({ images, currentCategory }: GalleryScrollRestorationProps) {
  const hasRestoredRef = useRef(false);

  useEffect(() => {
    if (hasRestoredRef.current) return;

    const restoreScrollPosition = () => {
      try {
        const returnPosition = sessionStorage.getItem('gallery_return_position');
        const returnImageId = sessionStorage.getItem('gallery_return_image_id');

        if (returnPosition && returnImageId) {
          const imageId = parseInt(returnImageId);
          const position = parseInt(returnPosition);

          // Verify the image still exists at expected position
          const imageAtPosition = images[position];
          if (imageAtPosition && imageAtPosition.id === imageId) {
            console.log(`✅ Image ID ${imageId} found at expected position ${position + 1}`);

            // Calculate scroll position based on image grid
            const imagesPerRow = 4;
            const targetRow = Math.floor(position / imagesPerRow);

            // Estimate card height: aspect-square + title + padding
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
          }
        }
      } catch (error) {
        console.error('❌ Scroll restoration failed:', error);
      }

      hasRestoredRef.current = true;
    };

    // Delay restoration to ensure DOM is ready
    const timeout = setTimeout(restoreScrollPosition, 100);
    return () => clearTimeout(timeout);
  }, [images, currentCategory]);

  return null;
}
```

---

## 🔥 Proactive Cache Warming

### **Gallery Cache Warming**
*File: `components/GalleryCacheWarmer.tsx`*

```typescript
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
    const totalPages = Math.ceil(totalImages / imagesPerLoad);

    // Function to warm next page of images
    const warmNextPage = async () => {
      const nextPage = currentPage + 1;

      if (nextPage <= totalPages && !warmedPages.has(nextPage)) {
        console.log(`🔥 Cache warming: Prefetching page ${nextPage} of ${totalPages}`);

        try {
          const apiUrl = currentCategory
            ? `/api/prefetch-images?category=${currentCategory}&page=${nextPage}`
            : `/api/prefetch-images?page=${nextPage}`;

          const response = await fetch(apiUrl);
          if (response.ok) {
            const data = await response.json();

            if (data.images && data.images.length > 0) {
              // Preload images with low priority
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

                      setWarmedCategories(prev => new Set(prev).add(category.slug));
                    }
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
    if (currentPage === 1 && totalPages > 1) {
      // Warm next page after 2 seconds
      setTimeout(warmNextPage, 2000);
      // Warm other categories after 5 seconds
      setTimeout(warmOtherCategories, 5000);
    }
  }, [currentCategory, currentPage, totalImages, imagesPerLoad, warmedPages, warmedCategories]);

  return null;
}
```

**Timeline:**
- **2 seconds**: Warm next page of current category
- **5 seconds**: Warm first 4 images from 3 other categories
- **Intelligent deduplication**: Won't re-warm already warmed content

---

## 🔗 API-Driven Prefetching

### **Enhanced Prefetch API**
*File: `app/api/prefetch-images/route.ts`*

```typescript
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const imageId = searchParams.get('id');
        const category = searchParams.get('category');
        const type = searchParams.get('type'); // 'categories' for getting category list
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        // If requesting categories list
        if (type === 'categories') {
            const categories = await getCategories();
            return NextResponse.json({
                categories,
                prefetched: true,
                timestamp: Date.now()
            });
        }

        // If specific image ID is requested
        if (imageId) {
            const image = await getImage(parseInt(imageId));
            if (!image) {
                return NextResponse.json({ error: 'Image not found' }, { status: 404 });
            }

            return NextResponse.json({
                image,
                prefetched: true,
                timestamp: Date.now()
            });
        }

        // If category is requested, get images from that category with pagination
        if (category) {
            const categoryImages = await getImages(category);

            // Calculate pagination
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedImages = categoryImages.slice(startIndex, endIndex);

            return NextResponse.json({
                images: paginatedImages,
                category,
                page,
                totalImages: categoryImages.length,
                totalPages: Math.ceil(categoryImages.length / limit),
                prefetched: true,
                timestamp: Date.now()
            });
        }

        // Default: return images with pagination
        const allImages = await getImages();
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedImages = allImages.slice(startIndex, endIndex);

        return NextResponse.json({
            images: paginatedImages,
            page,
            totalImages: allImages.length,
            totalPages: Math.ceil(allImages.length / limit),
            prefetched: true,
            timestamp: Date.now()
        });

    } catch (error) {
        console.error('❌ Prefetch API error:', error);
        return NextResponse.json({
            error: 'Prefetch failed',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        }, { status: 500 });
    }
}
```

**API Features:**
- **Pagination support**: `/api/prefetch-images?page=2&limit=20`
- **Category filtering**: `/api/prefetch-images?category=nature`
- **Metadata endpoints**: `/api/prefetch-images?type=categories`
- **Individual images**: `/api/prefetch-images?id=123`

---

## 🎯 Performance Results

### **Key Performance Indicators**

1. **Route Navigation**: 20-50ms (PPR static shells)
2. **Image Loading**: Predictive + parallel loading
3. **Back Navigation**: Position-aware + instant
4. **Cache Hit Rate**: Very high across multiple layers
5. **Memory Usage**: Optimized with cleanup and deduplication

### **Console Debug Output**
```bash
🔧 S3 Client initialized
🚀 Cache hit for image.jpg (47h remaining)
📍 Current image at position 38/59
🎯 Prefetching 15 images around position (32-47)
🔄 Restoring scroll to position 38 (image ID: 175)
🔥 Cache warming: Prefetching page 2 of 3
```

### **Browser Network Tab**
- **Staggered requests**: 50-100ms intervals
- **Cache headers**: Proper ETags and Last-Modified
- **Request deduplication**: No duplicate image requests
- **Prefetch priority**: Low priority for background prefetching

---

## 🔧 Configuration Options

### **Tunable Parameters**

```typescript
// Image loading thresholds
const PRIORITY_IMAGE_COUNT = 6;        // First N images get priority loading
const HIGH_QUALITY_COUNT = 12;         // First N images get quality=80 vs 65

// Prefetching distances
const LINK_PROXIMITY_THRESHOLD = 150;  // Regular links prefetch distance
const BACK_BUTTON_THRESHOLD = 200;     // Back button gets larger threshold

// Position-aware prefetching
const PREFETCH_RADIUS = 7;             // ±N images around current position

// Cache warming timing
const NEXT_PAGE_DELAY = 2000;          // 2s delay before warming next page
const OTHER_CATEGORIES_DELAY = 5000;   // 5s delay before warming other categories

// S3 URL caching
const URL_EXPIRES_IN = 48 * 60 * 60;   // 48 hours
const CACHE_EXPIRES_IN = 47 * 60 * 60; // 47 hours (1h buffer)
```

These values can be adjusted based on your specific use case, user behavior patterns, and performance requirements.