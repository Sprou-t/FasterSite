import { NextRequest, NextResponse } from 'next/server';

// NextFaster's prefetch-images API pattern
// This API extracts image metadata for prefetching without rendering the full page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ rest: string[] }> }
) {
  try {
    const { rest } = await params;
    const path = `/${rest.join('/')}`;

    // For image detail pages, extract the image ID and return prefetch data
    const imageIdMatch = path.match(/\/image\/(\w+)/);

    if (imageIdMatch) {
      const imageId = imageIdMatch[1];

      // Return mock prefetch data for now (replace with actual image queries later)
      return NextResponse.json({
        images: [
          {
            src: `https://images.unsplash.com/${imageId}?w=800&q=80`,
            srcset: `https://images.unsplash.com/${imageId}?w=400&q=80 400w, https://images.unsplash.com/${imageId}?w=800&q=80 800w, https://images.unsplash.com/${imageId}?w=1200&q=80 1200w`,
            sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 800px",
            loading: "eager",
            alt: `Image ${imageId}`
          }
        ],
        prefetched: true,
        timestamp: Date.now()
      });
    }

    // Default: return empty array for non-image pages
    return NextResponse.json({
      images: [],
      prefetched: true,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Prefetch API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prefetch data' },
      { status: 500 }
    );
  }
}

// Mark as force-static for edge caching (NextFaster pattern)
export const runtime = 'edge';
export const dynamic = 'force-static';