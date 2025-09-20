interface UnsplashImage {
  id: string;
  description: string | null;
  alt_description: string | null;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
    small_s3: string;
  };
  links: {
    download_location: string;
  };
  width: number;
  height: number;
  likes: number;
  user: {
    id: string;
    name: string;
    username: string;
  };
}

interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  results: UnsplashImage[];
}

export class UnsplashAPI {
  private baseUrl = 'https://api.unsplash.com';
  private accessKey: string;

  constructor(accessKey: string) {
    this.accessKey = accessKey;
  }

  private async fetch(endpoint: string, params: Record<string, string> = {}) {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Client-ID ${this.accessKey}`,
        'Accept-Version': 'v1',
      },
    });

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async searchPhotos(query: string, perPage: number = 30, page: number = 1): Promise<UnsplashSearchResponse> {
    return this.fetch('/search/photos', {
      query,
      per_page: perPage.toString(),
      page: page.toString(),
      order_by: 'relevant',
    });
  }

  async registerDownload(downloadUrl: string): Promise<void> {
    // Required by Unsplash API for usage tracking
    await fetch(downloadUrl, {
      headers: {
        'Authorization': `Client-ID ${this.accessKey}`,
      },
    });
  }

  /**
   * Get optimized URL for specific dimensions
   * Uses Unsplash's dynamic resizing
   */
  getOptimizedUrl(image: UnsplashImage, width: number = 800, quality: number = 80): string {
    return `${image.urls.raw}&w=${width}&q=${quality}&fm=webp&fit=crop`;
  }

  /**
   * Download image buffer for local storage
   */
  async downloadImage(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }
}