import { unstable_cache } from '@/features/performance/lib/cache';
import { db } from './db';
import { categories, images } from './schema';
import { eq, count, sql } from 'drizzle-orm';
import type { Category, Image } from './schema';

interface ImageWithCategory extends Image {
  category: Category;
}

// NextFaster's exact query caching patterns with 2-hour revalidation

export const getCategories = unstable_cache(
  async (): Promise<Category[]> => {
    console.log('🔍 Fetching categories from database...');
    return await db.select().from(categories);
  },
  ['categories'],
  {
    revalidate: 60 * 60 * 2, // 2 hours
  }
);

export const getImages = unstable_cache(
  async (categorySlug?: string): Promise<Image[]> => {
    console.log(`🔍 Fetching images from database${categorySlug ? ` for category: ${categorySlug}` : ' (all images)'}...`);

    let dbImages: Image[];

    if (!categorySlug) {
      console.log('📊 Querying all images from database...');
      dbImages = await db.select().from(images);
    } else {
      console.log(`📊 Querying images for category: ${categorySlug}...`);
      // Get category by slug first
      const categoryResults = await db.select().from(categories).where(eq(categories.slug, categorySlug));

      if (categoryResults.length === 0) {
        console.log(`❌ Category ${categorySlug} not found`);
        return [];
      }

      const category = categoryResults[0];
      dbImages = await db.select().from(images).where(eq(images.categoryId, category.id));
    }

    console.log(`📈 Found ${dbImages.length} images in database`);
    return dbImages;
  },
  (categorySlug?: string) => ['images', categorySlug || 'all'], // Dynamic cache key
  {
    revalidate: 60 * 60 * 2, // 2 hours
  }
);

export const getImage = unstable_cache(
  async (id: number): Promise<Image | null> => {
    console.log(`🔍 Fetching image ${id} from database...`);

    const results = await db.select().from(images).where(eq(images.id, id));
    if (results.length === 0) return null;

    const image = results[0];
    console.log(`✅ Found image: ${image.title}`);
    return image;
  },
  (id: number) => ['image', id.toString()],
  {
    revalidate: 60 * 60 * 2, // 2 hours
  }
);

export const getImageCount = unstable_cache(
  async (categorySlug?: string): Promise<number> => {
    if (!categorySlug) {
      console.log('📊 Counting ALL images using database COUNT...');
      const result = await db.select({ count: count() }).from(images);
      const totalCount = result[0].count;
      console.log(`✅ Total images: ${totalCount}`);
      return totalCount;
    } else {
      console.log(`📊 Counting images for category: ${categorySlug} using JOIN + COUNT...`);
      // JOIN with categories table for filtered count
      const result = await db
        .select({ count: count() })
        .from(images)
        .leftJoin(categories, eq(images.categoryId, categories.id))
        .where(eq(categories.slug, categorySlug));
      const categoryCount = result[0].count;
      console.log(`✅ Images in ${categorySlug}: ${categoryCount}`);
      return categoryCount;
    }
  },
  (categorySlug?: string) => ['image-count', categorySlug || 'all'],
  {
    revalidate: 60 * 60 * 2, // 2 hours
  }
);

// Get categories with image counts
export const getCategoriesWithCounts = unstable_cache(
  async (): Promise<Array<Category & { imageCount: number }>> => {
    console.log('🏷️ Fetching categories with image counts...');

    // First get all categories
    const allCategories = await db.select().from(categories);
    console.log(`📂 Found ${allCategories.length} categories`);

    // Then get all images with their category IDs
    const allImages = await db.select({ categoryId: images.categoryId }).from(images);
    console.log(`📸 Found ${allImages.length} images`);

    // Count images per category
    const categoriesWithCounts = allCategories.map(category => {
      const imageCount = allImages.filter(image => image.categoryId === category.id).length;
      return {
        ...category,
        imageCount
      };
    });

    console.log('📊 Categories with counts:', categoriesWithCounts.map(cat => `${cat.name}: ${cat.imageCount}`));
    return categoriesWithCounts;
  },
  ['categories-with-counts'],
  {
    revalidate: 60 * 60 * 2, // 2 hours
  }
);

// Get all images with category information (simplified approach) - CACHE DISABLED FOR DEBUG
export const getAllImages = async (): Promise<ImageWithCategory[]> => {
    console.log('🔍 Fetching all images with categories from database...');

    // First get all images
    const allImages = await db.select().from(images);
    console.log(`📈 Found ${allImages.length} images`);

    // Then get all categories
    const allCategories = await db.select().from(categories);
    console.log(`📂 Found ${allCategories.length} categories`);

    // Create category lookup map
    const categoryMap = allCategories.reduce((map, cat) => {
      map[cat.id] = cat;
      return map;
    }, {} as Record<number, Category>);

    // Combine images with their categories
    const imagesWithCategories: ImageWithCategory[] = allImages.map(image => ({
      ...image,
      category: categoryMap[image.categoryId] || {
        id: 0,
        name: 'Unknown',
        slug: 'unknown'
      }
    }));

    console.log(`✅ Successfully combined ${imagesWithCategories.length} images with categories`);
    return imagesWithCategories;
};

// Get image by Unsplash ID with category information (simplified approach)
export const getImageById = unstable_cache(
  async (unsplashId: string): Promise<ImageWithCategory | null> => {
    console.log(`🔍 Fetching image ${unsplashId} with category from database...`);

    // Get the image
    const imageResults = await db.select().from(images).where(eq(images.unsplashId, unsplashId));

    if (imageResults.length === 0) {
      console.log(`❌ Image ${unsplashId} not found`);
      return null;
    }

    const image = imageResults[0];

    // Get the category
    const categoryResults = await db.select().from(categories).where(eq(categories.id, image.categoryId));
    const category = categoryResults.length > 0 ? categoryResults[0] : {
      id: 0,
      name: 'Unknown',
      slug: 'unknown'
    };

    const imageWithCategory: ImageWithCategory = {
      ...image,
      category
    };

    console.log(`✅ Found image: ${imageWithCategory.title}`);
    return imageWithCategory;
  },
  (unsplashId: string) => ['image-by-unsplash-id', unsplashId],
  {
    revalidate: 60 * 60 * 2, // 2 hours
  }
);

// NextFaster search functionality with hybrid approach
export const searchImages = unstable_cache(
  async (searchTerm: string): Promise<Image[]> => {
    console.log(`🔍 Searching images for: "${searchTerm}"`);

    if (!searchTerm || searchTerm.trim().length === 0) {
      console.log('❌ Empty search term');
      return [];
    }

    const trimmedTerm = searchTerm.trim();
    let searchResults: Image[];

    if (trimmedTerm.length <= 2) {
      // For short terms, use ILIKE for prefix matching (NextFaster approach)
      console.log(`📝 Using ILIKE prefix search for short term: "${trimmedTerm}"`);
      searchResults = await db
        .select()
        .from(images)
        .where(sql`${images.title} ILIKE ${trimmedTerm + "%"}`)
        .limit(20);
    } else {
      // For longer terms, use PostgreSQL full-text search (NextFaster approach)
      console.log(`🔍 Using full-text search for term: "${trimmedTerm}"`);

      // Format search term for tsquery (add :* for prefix matching on each word)
      const formattedSearchTerm = trimmedTerm
        .split(' ')
        .filter(term => term.trim() !== '')
        .map(term => `${term}:*`)
        .join(' & ');

      console.log(`🔍 Formatted search term: "${formattedSearchTerm}"`);

      try {
        searchResults = await db
          .select()
          .from(images)
          .where(
            sql`to_tsvector('english', ${images.title} || ' ' || COALESCE(${images.description}, '')) @@ to_tsquery('english', ${formattedSearchTerm})`
          )
          .limit(20);
      } catch (error) {
        console.error('❌ Full-text search failed, falling back to ILIKE:', error);
        // Fallback to ILIKE if full-text search fails
        searchResults = await db
          .select()
          .from(images)
          .where(sql`${images.title} ILIKE ${'%' + trimmedTerm + '%'}`)
          .limit(20);
      }
    }

    console.log(`📈 Found ${searchResults.length} search results`);
    return searchResults;
  },
  (searchTerm: string) => ['search-results', searchTerm.toLowerCase().trim()],
  {
    revalidate: 60 * 60 * 2, // 2 hours cache
  }
);