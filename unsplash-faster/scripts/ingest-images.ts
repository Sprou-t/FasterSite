import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { UnsplashAPI } from '../lib/unsplash';
import { db } from '../lib/db';
import { categories, images } from '../lib/schema';

// Categories to search for on Unsplash - optimized for 200 high-quality images
const SEARCH_CATEGORIES = [
  { slug: 'nature', name: 'Nature', searchTerm: 'nature landscape mountains', count: 50 },
  { slug: 'architecture', name: 'Architecture', searchTerm: 'modern architecture buildings', count: 40 },
  { slug: 'technology', name: 'Technology', searchTerm: 'technology computer coding', count: 30 },
  { slug: 'travel', name: 'Travel', searchTerm: 'travel destinations cities', count: 40 },
  { slug: 'lifestyle', name: 'Lifestyle', searchTerm: 'lifestyle people coffee', count: 40 },
];

interface IngestConfig {
  unsplashAccessKey: string;
}

export async function ingestFromUnsplash(config: IngestConfig) {
  console.log('🚀 Starting UnsplashFaster ingestion for 200 images...');

  const unsplash = new UnsplashAPI(config.unsplashAccessKey);

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

    let totalIngested = 0;

    // Step 2: Process each category
    for (const category of SEARCH_CATEGORIES) {
      console.log(`\n🔍 Processing category: ${category.name} (target: ${category.count} images)`);

      try {
        // Calculate pages needed (30 images per page max)
        const pagesNeeded = Math.ceil(category.count / 30);
        let categoryIngested = 0;

        for (let page = 1; page <= pagesNeeded && categoryIngested < category.count; page++) {
          console.log(`📄 Fetching page ${page} for ${category.name}...`);

          const searchResults = await unsplash.searchPhotos(
            category.searchTerm,
            Math.min(30, category.count - categoryIngested),
            page
          );

          console.log(`📸 Found ${searchResults.results.length} images on page ${page}`);

          // Process each image from this page
          for (const unsplashImage of searchResults.results) {
            if (categoryIngested >= category.count) break;

            try {
              console.log(`⬇️ Processing image ${categoryIngested + 1}/${category.count}: ${unsplashImage.id}`);

              // Register download with Unsplash (required for API compliance)
              await unsplash.registerDownload(unsplashImage.links.download_location);

              // Get optimized URL (800px width, WebP format)
              const optimizedUrl = unsplash.getOptimizedUrl(unsplashImage, 800, 80);

              // Save to database
              await db.insert(images).values({
                title: unsplashImage.description || unsplashImage.alt_description || `${category.name} Image`,
                description: unsplashImage.alt_description || unsplashImage.description,
                imageUrl: optimizedUrl,
                originalUrl: unsplashImage.urls.regular,
                categoryId: categoryMap[category.slug],
                width: unsplashImage.width,
                height: unsplashImage.height,
                unsplashId: unsplashImage.id,
                unsplashUserId: unsplashImage.user.id,
                unsplashUserName: unsplashImage.user.name,
                unsplashLikes: unsplashImage.likes,
              });

              categoryIngested++;
              totalIngested++;
              console.log(`✅ Processed: ${unsplashImage.id} (${totalIngested}/200 total)`);

              // Small delay to respect rate limits
              await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
              console.error(`❌ Failed to process image ${unsplashImage.id}:`, error);
              // Continue with next image
            }
          }
        }

        console.log(`✅ Completed category: ${category.name} (${categoryIngested} images)`);

      } catch (error) {
        console.error(`❌ Failed to process category ${category.name}:`, error);
        // Continue with next category
      }
    }

    console.log(`\n🎉 Ingestion completed successfully!`);
    console.log(`📊 Total images ingested: ${totalIngested}/200`);

    // Return summary
    const finalImages = await db.select().from(images);
    const finalCategories = await db.select().from(categories);

    return {
      success: true,
      categories: finalCategories.length,
      images: finalImages.length,
      breakdown: SEARCH_CATEGORIES.map(cat => ({
        category: cat.name,
        target: cat.count,
        actual: finalImages.filter(img => img.categoryId === categoryMap[cat.slug]).length
      }))
    };

  } catch (error) {
    console.error('💥 Ingestion failed:', error);
    throw error;
  }
}

// CLI runner
async function main() {
  const config: IngestConfig = {
    unsplashAccessKey: process.env.UNSPLASH_ACCESS_KEY!,
  };

  // Validate config
  if (!config.unsplashAccessKey) {
    console.error('❌ UNSPLASH_ACCESS_KEY environment variable required');
    process.exit(1);
  }

  try {
    const result = await ingestFromUnsplash(config);
    console.log('🎉 Final Summary:', result);
    process.exit(0);
  } catch (error) {
    console.error('💥 Ingestion failed:', error);
    process.exit(1);
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}