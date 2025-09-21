import { NextRequest, NextResponse } from 'next/server';
import { parseHTML } from 'linkedom';

// NextFaster's prefetch-images API pattern
// This API fetches the actual page HTML and extracts real image URLs
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ rest: string[] }> }
) {
  try {
    const { rest } = await params;
    const href = rest.join('/');

    if (!href) {
      return NextResponse.json({ images: [] });
    }

    // Build URL to fetch actual page HTML
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const host = request.headers.get('host') || 'localhost:3001';
    const url = `${protocol}://${host}/${href}`;

    // Fetch the actual page HTML
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status}`);
      return NextResponse.json({ images: [] });
    }

    const body = await response.text();
    const { document } = parseHTML(body);

    // Extract all images from the main content (like NextFaster does)
    const images = Array.from(document.querySelectorAll('main img'))
      .map((img) => ({
        srcset: img.getAttribute('srcset') || img.getAttribute('srcSet'),
        sizes: img.getAttribute('sizes'),
        src: img.getAttribute('src'),
        alt: img.getAttribute('alt'),
        loading: img.getAttribute('loading'),
      }))
      .filter((img) => img.src && !img.src.startsWith('data:'));

    return NextResponse.json(
      { images },
      {
        headers: {
          'Cache-Control': 'public, max-age=3600',
        },
      }
    );

  } catch (error) {
    console.error('Prefetch API error:', error);
    return NextResponse.json({ images: [] });
  }
}

// Allow dynamic behavior for database queries
export const dynamic = 'force-dynamic';