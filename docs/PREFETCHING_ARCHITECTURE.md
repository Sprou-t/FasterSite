# Image Prefetching & Caching Architecture

## Overview

This document explains the complete image prefetching and caching system implemented in the Unsplash Gallery application, based on NextFaster's optimization patterns.

## Architecture Components

### 1. OptimizedLink Component
**File**: `components/custom/OptimizedLink.tsx`
- Custom Link component that handles route and image prefetching
- Uses Intersection Observer for viewport-based prefetching
- Implements mouse proximity prefetching
- Manages global caches for deduplication

### 2. Prefetch API Route
**File**: `app/api/prefetch-images/[...rest]/route.ts`
- Server-side HTML parsing to extract real image URLs
- Fetches actual page content to get Next.js optimized URLs
- Returns exact image metadata that pages will request

### 3. Gallery Integration
**File**: `features/gallery/components/ImageGrid.tsx`
- Renders OptimizedLink components for each image
- Triggers prefetching when image cards enter viewport

## Complete Data Flow

### Step 1: Gallery Page Load
```
User visits gallery → ImageGrid renders OptimizedLink components
```

**Code Location**: `features/gallery/components/ImageGrid.tsx:43-45`
```typescript
<OptimizedLink href={`/image/${image.unsplashId}`} className="block">
```

### Step 2: Viewport Detection
```
Image card enters viewport → Intersection Observer triggered → 300ms delay → Prefetching begins
```

**Code Location**: `components/custom/OptimizedLink.tsx:102-127`
```typescript
const observer = new IntersectionObserver((entries) => {
    const entry = entries[0];
    if (entry.isIntersecting) {
        prefetchTimeout.current = setTimeout(async () => {
            // Prefetching logic
        }, 300);
    }
}, { rootMargin: "0px", threshold: 0.1 });
```

### Step 3: Route Prefetching (JavaScript)
```
Next.js downloads JavaScript bundles for target page
```

**Code Location**: `components/custom/OptimizedLink.tsx:108`
```typescript
router.prefetch(href); // Downloads /image/[id]/page.tsx component code
```

**What gets cached**:
- Page component JavaScript
- Shared layout components
- Required dependencies
- **Result**: Zero JavaScript download time on navigation

### Step 4: HTML Content Fetching
```
API call to extract image metadata from target page
```

**Code Location**: `components/custom/OptimizedLink.tsx:115`
```typescript
void prefetchImages(href).then((images) => {
    imageCache.set(href, images); // Cache metadata
    images.forEach(image => prefetchImage(image)); // Cache images
});
```

**API Function**: `components/custom/OptimizedLink.tsx:74-76`
```typescript
const response = await fetch(`/api/prefetch-images${href}`, {
    priority: "low",
});
```

### Step 5: Server-Side HTML Parsing
```
Server fetches its own page HTML → Parses <img> tags → Returns real URLs
```

**Code Location**: `app/api/prefetch-images/[...rest]/route.ts:24-42`
```typescript
// Fetch actual page HTML
const response = await fetch(url);
const body = await response.text();

// Parse HTML and extract images
const { document } = parseHTML(body);
const images = Array.from(document.querySelectorAll('main img'))
    .map((img) => ({
        srcset: img.getAttribute('srcset'),
        sizes: img.getAttribute('sizes'),
        src: img.getAttribute('src'),
        alt: img.getAttribute('alt'),
        loading: img.getAttribute('loading'),
    }))
    .filter((img) => img.src && !img.src.startsWith('data:'));
```

### Step 6: Client-Side Image Caching
```
For each image metadata → Create new Image() → Browser caches image
```

**Code Location**: `components/custom/OptimizedLink.tsx:37-67`
```typescript
function prefetchImage(image: PrefetchImage) {
    // Skip if lazy or already seen
    if (image.loading === "lazy" || seenImages.has(image.srcset || image.src)) {
        return;
    }

    // Create image element and trigger caching
    const img = new Image();
    img.decoding = "async";
    img.fetchPriority = "low";

    // Mark as seen before loading
    seenImages.add(image.srcset || image.src);

    // Set attributes in correct order
    if (image.sizes) img.sizes = image.sizes;
    if (image.srcset) img.srcset = image.srcset;
    if (image.src) img.src = image.src; // Triggers download
}
```

### Step 7: User Navigation
```
User clicks image → Instant navigation (JS cached) → Instant image display (cache hit)
```

**Code Location**: `components/custom/OptimizedLink.tsx:163-176`
```typescript
onMouseDown={(e) => {
    if (/* same origin click */) {
        e.preventDefault();
        router.push(href); // Instant navigation
    }
}}
```

## Global Caches

### seenImages Cache
**Type**: `Set<string>`
**Purpose**: Prevent duplicate image downloads
**Key**: Image srcset or src URL
**Example**: `"/_next/image?url=https%3A%2F%2Fimages.unsplash.com%2F..."`

### imageCache Cache
**Type**: `Map<string, PrefetchImage[]>`
**Purpose**: Store image metadata per route
**Key**: Route href (e.g., `/image/abc123`)
**Value**: Array of image metadata objects

**Example**:
```typescript
imageCache.set("/image/abc123", [
    {
        src: "/_next/image?url=https%3A%2F%2Fimages.unsplash.com%2F...&w=1280&q=90",
        srcset: "/_next/image?url=...&w=480&q=90 480w, /_next/image?url=...&w=640&q=90 640w, ...",
        sizes: "(max-width: 768px) 100vw, 50vw",
        alt: "Beautiful landscape",
        loading: "eager"
    }
]);
```

## Performance Benefits

### Before Optimization
```
User clicks image → Download JS (500ms) → Parse/Execute (200ms) → Download image (1500ms) → Display
Total: ~2200ms
```

### After Optimization
```
User clicks image → Instant navigation (0ms) → Instant image display (0ms)
Total: ~50ms (just navigation overhead)
```

## Key Insights

### Why This Works
1. **Perfect URL Matching**: We prefetch the exact URLs that Next.js Image component requests
2. **Server-Side Parsing**: No guessing - we extract real URLs from rendered HTML
3. **Proactive Caching**: Everything is cached before user needs it
4. **Global Deduplication**: Prevents wasteful duplicate downloads

### NextFaster Pattern
This implementation follows NextFaster's core principle: **fetch the actual page to get real URLs** instead of trying to manually construct optimized URLs.

## File Dependencies

```
components/custom/OptimizedLink.tsx
├── next/link (NextLink component)
├── next/navigation (useRouter)
├── react (useEffect, useRef)
└── app/api/prefetch-images/[...rest]/route.ts

app/api/prefetch-images/[...rest]/route.ts
├── next/server (NextRequest, NextResponse)
└── linkedom (parseHTML)

features/gallery/components/ImageGrid.tsx
└── components/custom/OptimizedLink.tsx
```

## Console Logging

The system provides detailed console logging for debugging:

- `🔍 NEXTFASTER VIEWPORT: Prefetching route /image/abc123`
- `📡 NEXTFASTER: Fetching image metadata for /image/abc123`
- `💾 NEXTFASTER: Cached 1 image(s) metadata for /image/abc123`
- `🖼️ NEXTFASTER: Starting prefetch for FULL URL: /_next/image?url=...`
- `✅ NEXTFASTER: Successfully cached image /_next/image?url=...`
- `⚡ NEXTFASTER MOUSEDOWN: Immediate navigation to /image/abc123`

## Troubleshooting

### Images Still Downloading on Click
1. Check console for successful cache messages (`✅ NEXTFASTER: Successfully cached`)
2. Verify URLs match exactly between prefetch and page load
3. Ensure API is returning correct image metadata
4. Check Network tab for cache hits vs new requests

### Prefetching Not Triggering
1. Verify Intersection Observer is working (viewport logs)
2. Check if `prefetch={false}` is set on OptimizedLink
3. Ensure image cards are actually entering viewport
4. Check for JavaScript errors preventing execution