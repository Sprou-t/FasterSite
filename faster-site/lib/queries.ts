import { unstable_cache } from './cache';
import { db } from './db';
import { categories, images } from './schema';
import { eq } from 'drizzle-orm';
import { S3Client } from './s3';
import type { Category, Image } from './schema';

// Create S3 client for generating secure URLs
const s3Client = new S3Client({
  bucketName: process.env.S3_BUCKET_NAME!,
  region: process.env.S3_REGION!,
  accessKeyId: process.env.S3_ACCESS_KEY_ID!,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
});

console.log('🔧 S3 Client initialized with:', {
  bucketName: process.env.S3_BUCKET_NAME,
  region: process.env.S3_REGION,
  accessKeyId: process.env.S3_ACCESS_KEY_ID ? 'SET' : 'MISSING',
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ? 'SET' : 'MISSING',
});

// Helper function to add secure URLs to images
async function addSecureUrls<T extends { s3Key: string; s3Url: string }[]>(images: T): Promise<T> {
  console.log(`🔐 Attempting to generate secure URLs for ${images.length} images...`);

  // Test with just the first image to see what error we get
  if (images.length > 0) {
    try {
      console.log(`🧪 Testing secure URL generation for first image: ${images[0].s3Key}`);
      const testSecureUrl = await s3Client.getSecureImageUrl(images[0].s3Key, 3600);
      console.log(`✅ Test successful! Generated secure URL: ${testSecureUrl.substring(0, 100)}...`);
    } catch (error) {
      console.error(`❌ Secure URL generation failed:`, error);
      console.error(`❌ Error details:`, {
        name: error.name,
        message: error.message,
        stack: error.stack?.substring(0, 500)
      });
      console.log(`⚠️ Falling back to original URLs`);
      return images; // Return original URLs if secure URL generation fails
    }
  }

  const updatedImages = await Promise.all(
    images.map(async (image) => {
      try {
        const secureUrl = await s3Client.getSecureImageUrl(image.s3Key, 3600); // 1 hour expiry
        return { ...image, s3Url: secureUrl };
      } catch (error) {
        console.error(`❌ Failed to generate secure URL for ${image.s3Key}:`, error);
        return image; // Return with original URL as fallback
      }
    })
  );
  return updatedImages as T;
}

// Real database queries with caching (NextFaster pattern)

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
    // Generate secure URLs for all images
    console.log(`🔐 Generating secure URLs for ${dbImages.length} images...`);
    return await addSecureUrls(dbImages);
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
    console.log(`🔐 Generating secure URL for image ${id}...`);

    // Generate secure URL for single image
    const imagesWithSecureUrls = await addSecureUrls([image]);
    return imagesWithSecureUrls[0];
  },
  ['image'],
  {
    revalidate: 60 * 60 * 2, // 2 hours
  }
);

export const getImageCount = unstable_cache(
  async (categorySlug?: string): Promise<number> => {
    const imageList = await getImages(categorySlug);
    return imageList.length;
  },
  ['image-count'],
  {
    revalidate: 60 * 60 * 2, // 2 hours
  }
);