import { unstable_cache } from './cache';
import { mockCategories, mockImages } from '@/data/mockData';
import type { Category, Image } from './schema';

// Mock database queries with caching (NextFaster pattern)
// Note: Database schema exists for Phase 2, but we're using mock data for now

export const getCategories = unstable_cache(
  async (): Promise<Category[]> => {
    // Simulate database delay for realistic caching behavior
    await new Promise(resolve => setTimeout(resolve, 10));
    return mockCategories;
  },
  ['categories'],
  {
    revalidate: 60 * 60 * 2, // 2 hours
  }
);

export const getImages = unstable_cache(
  async (categorySlug?: string): Promise<Image[]> => {
    // Simulate database delay for realistic caching behavior
    await new Promise(resolve => setTimeout(resolve, 20));

    if (!categorySlug) {
      return mockImages;
    }

    const category = mockCategories.find(cat => cat.slug === categorySlug);
    if (!category) {
      return [];
    }

    return mockImages.filter(img => img.categoryId === category.id);
  },
  ['images'],
  {
    revalidate: 60 * 60 * 2, // 2 hours
  }
);

export const getImage = unstable_cache(
  async (id: number): Promise<Image | null> => {
    // Simulate database delay for realistic caching behavior
    await new Promise(resolve => setTimeout(resolve, 15));

    return mockImages.find(img => img.id === id) || null;
  },
  ['image'],
  {
    revalidate: 60 * 60 * 2, // 2 hours
  }
);

export const getImageCount = unstable_cache(
  async (categorySlug?: string): Promise<number> => {
    const images = await getImages(categorySlug);
    return images.length;
  },
  ['image-count'],
  {
    revalidate: 60 * 60 * 2, // 2 hours
  }
);