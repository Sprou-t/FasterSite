import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { UnsplashAPI } from './unsplash';
import { S3Client } from './s3';
import { db } from './db';
import { categories, images } from './schema';

// Categories to search for on Unsplash
const SEARCH_CATEGORIES = [
  { slug: 'nature', name: 'Nature', searchTerm: 'nature landscape' },
  { slug: 'architecture', name: 'Architecture', searchTerm: 'architecture building' },
  { slug: 'technology', name: 'Technology', searchTerm: 'technology computer' },
  { slug: 'business', name: 'Business', searchTerm: 'business office' },
  { slug: 'art', name: 'Art', searchTerm: 'art creative' },
];

const IMAGES_PER_CATEGORY = 20;

interface IngestConfig {
  unsplashAccessKey: string;
  s3Config: {
    bucketName: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
}

export async function ingestFromUnsplash(config: IngestConfig) {
  console.log('🚀 Starting Unsplash ingestion...');

  const unsplash = new UnsplashAPI(config.unsplashAccessKey);
  const s3Client = new S3Client(config.s3Config);

  try {
    // Step 1: Clear existing data and create categories
    console.log('🧹 Clearing existing data...');
    await db.delete(images);
    await db.delete(categories);

    console.log('📂 Creating categories...');
    const insertedCategories = await db.insert(categories).values(
      SEARCH_CATEGORIES.map(cat => ({ slug: cat.slug, name: cat.name }))
    ).returning();

    const categoryMap = insertedCategories.reduce((map, cat) => {
      map[cat.slug] = cat.id;
      return map;
    }, {} as Record<string, number>);

    console.log(`✅ Created ${insertedCategories.length} categories`);

    // Step 2: Process each category
    for (const category of SEARCH_CATEGORIES) {
      console.log(`\n🔍 Processing category: ${category.name}`);

      try {
        // Search Unsplash
        const searchResults = await unsplash.searchPhotos(category.searchTerm, IMAGES_PER_CATEGORY);
        console.log(`📸 Found ${searchResults.results.length} images for ${category.name}`);

        // Process each image
        for (let i = 0; i < Math.min(searchResults.results.length, IMAGES_PER_CATEGORY); i++) {
          const unsplashImage = searchResults.results[i];

          try {
            console.log(`⬇️ Processing image ${i + 1}/${IMAGES_PER_CATEGORY}: ${unsplashImage.id}`);

            // Register download with Unsplash (required)
            await unsplash.registerDownload(unsplashImage.links.download_location);

            // Download optimized image
            const optimizedUrl = unsplash.getOptimizedUrl(unsplashImage, 800);
            const imageBuffer = await unsplash.downloadImage(optimizedUrl);

            // Upload to S3
            const s3Result = await s3Client.uploadImage(
              imageBuffer,
              `${unsplashImage.id}.jpg`,
              'image/jpeg'
            );

            // Save to database
            await db.insert(images).values({
              title: unsplashImage.description || unsplashImage.alt_description || `${category.name} Image`,
              description: unsplashImage.alt_description || unsplashImage.description,
              s3Key: s3Result.s3Key,
              s3Url: s3Result.s3Url,
              categoryId: categoryMap[category.slug],
              width: unsplashImage.width,
              height: unsplashImage.height,
              fileSize: s3Result.fileSize,
              contentHash: s3Result.contentHash,
              unsplashId: unsplashImage.id,
              unsplashUserId: unsplashImage.user.id,
              unsplashLikes: unsplashImage.likes,
            });

            console.log(`✅ Processed: ${unsplashImage.id}`);

          } catch (error) {
            console.error(`❌ Failed to process image ${unsplashImage.id}:`, error);
            // Continue with next image
          }
        }

        console.log(`✅ Completed category: ${category.name}`);

      } catch (error) {
        console.error(`❌ Failed to process category ${category.name}:`, error);
        // Continue with next category
      }
    }

    console.log('\n🎉 Ingestion completed successfully!');

    // Return summary
    const totalImages = await db.select().from(images);
    const totalCategories = await db.select().from(categories);

    return {
      success: true,
      categories: totalCategories.length,
      images: totalImages.length,
    };

  } catch (error) {
    console.error('💥 Ingestion failed:', error);
    throw error;
  }
}

// CLI runner
if (require.main === module) {
  const config: IngestConfig = {
    unsplashAccessKey: process.env.UNSPLASH_ACCESS_KEY!,
    s3Config: {
      bucketName: process.env.S3_BUCKET_NAME!,
      region: process.env.S3_REGION!,
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  };

  // Validate config
  if (!config.unsplashAccessKey) {
    console.error('❌ UNSPLASH_ACCESS_KEY environment variable required');
    process.exit(1);
  }

  if (!config.s3Config.bucketName) {
    console.error('❌ S3 configuration environment variables required');
    process.exit(1);
  }

  ingestFromUnsplash(config)
    .then((result) => {
      console.log('🎉 Ingestion completed:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Ingestion failed:', error);
      process.exit(1);
    });
}