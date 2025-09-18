// Unsplash API integration
export interface UnsplashImage {
  id: string;
  slug: string;
  description: string | null;
  alt_description: string | null;
  width: number;
  height: number;
  color: string;
  blur_hash: string | null;
  created_at: string;
  updated_at: string;
  likes: number;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  links: {
    self: string;
    html: string;
    download: string;
    download_location: string;
  };
  user: {
    id: string;
    username: string;
    name: string;
  };
}

export interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  results: UnsplashImage[];
}

export class UnsplashAPI {
  private accessKey: string;
  private baseUrl = 'https://api.unsplash.com';

  constructor(accessKey: string) {
    this.accessKey = accessKey;
  }

  private async makeRequest<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Client-ID ${this.accessKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async searchPhotos(query: string, perPage: number = 20): Promise<UnsplashSearchResponse> {
    console.log(`🔍 Searching Unsplash for: ${query} (${perPage} photos)`);
    return this.makeRequest<UnsplashSearchResponse>(
      `/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&order_by=popular`
    );
  }

  async registerDownload(downloadLocationUrl: string): Promise<void> {
    console.log(`📝 Registering download with Unsplash`);
    // Required by Unsplash API - must call this before downloading
    await fetch(downloadLocationUrl, {
      headers: {
        'Authorization': `Client-ID ${this.accessKey}`,
      },
    });
  }

  async downloadImage(imageUrl: string): Promise<ArrayBuffer> {
    console.log(`⬇️ Downloading image: ${imageUrl}`);
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }
    return response.arrayBuffer();
  }

  // Get optimized URL for specific dimensions
  getOptimizedUrl(image: UnsplashImage, width: number = 800): string {
    // Use Unsplash's dynamic resizing
    return `${image.urls.raw}&w=${width}&dpr=2&q=80&auto=format`;
  }
}