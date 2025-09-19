import { unstable_cache } from './cache';
import { db } from './db';
import { categories, images } from './schema';
import { eq, count, sql } from 'drizzle-orm';
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

// S3 URL Caching Configuration
const URL_EXPIRES_IN = 48 * 60 * 60; // 48 hours
const CACHE_EXPIRES_IN = 47 * 60 * 60; // 47 hours (1 hour buffer)
const CLEANUP_INTERVAL = 2 * 60 * 60 * 1000; // 2 hours cleanup

// In-memory cache for signed URLs
const urlCache = new Map<string, { url: string; expires: number }>();

// Cached secure URL generation
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

    console.log(`✅ Cached URL for ${s3Key} (expires in 47h)`);
    return newUrl;
}

// Cleanup expired cache entries
setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, value] of urlCache.entries()) {
        if (value.expires <= now) {
            urlCache.delete(key);
            cleaned++;
        }
    }
    if (cleaned > 0) {
        console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
    }
}, CLEANUP_INTERVAL);

// Helper function to add secure URLs to images (now with caching!)
async function addSecureUrls<T extends { s3Key: string; s3Url: string }[]>(images: T): Promise<T> {
    console.log(`🔐 Processing secure URLs for ${images.length} images (with 48h caching)...`);

    // Test with just the first image to see what error we get
    if (images.length > 0) {
        try {
            console.log(`🧪 Testing secure URL generation for first image: ${images[0].s3Key}`);
            const testSecureUrl = await getCachedSecureUrl(images[0].s3Key);
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
                const secureUrl = await getCachedSecureUrl(image.s3Key);
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
    (categorySlug?: string) => ['images', categorySlug || 'all', 'v2'], // Dynamic cache key
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

// Search functionality (NextFaster pattern)
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
            // For short terms, use ILIKE for prefix matching (like NextFaster)
            console.log(`📝 Using ILIKE prefix search for short term: "${trimmedTerm}"`);
            searchResults = await db
                .select()
                .from(images)
                .where(sql`${images.title} ILIKE ${trimmedTerm + "%"}`)
                .limit(20);
        } else {
            // For longer terms, use PostgreSQL full-text search (like NextFaster)
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

        // Apply secure URL generation to search results
        return await addSecureUrls(searchResults);
    },
    (searchTerm: string) => ['search-results', searchTerm.toLowerCase().trim()],
    {
        revalidate: 60 * 60 * 2, // 2 hours cache
    }
);