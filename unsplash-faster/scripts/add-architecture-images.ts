// Load environment variables FIRST before any other imports
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// Now import everything else
import { UnsplashAPI } from '../lib/unsplash';
import { db } from '../lib/db';
import { categories, images } from '../lib/schema';
import { eq } from 'drizzle-orm';

async function addArchitectureImages() {
  console.log('🏗️ Adding 50 Architecture images to database...');

  const unsplash = new UnsplashAPI(process.env.UNSPLASH_ACCESS_KEY!);

  try {
    // Step 1: Get or create the Architecture category
    console.log('📂 Setting up Architecture category...');

    let architectureCategoryId: number;
    const existingArchitecture = await db.select().from(categories).where(eq(categories.slug, 'architecture'));

    if (existingArchitecture.length === 0) {
      const [architectureCategory] = await db.insert(categories).values({
        slug: 'architecture',
        name: 'Architecture'
      }).returning();
      architectureCategoryId = architectureCategory.id;
      console.log(`✅ Created "Architecture" category with ID: ${architectureCategoryId}`);
    } else {
      architectureCategoryId = existingArchitecture[0].id;
      console.log(`✅ Found existing "Architecture" category with ID: ${architectureCategoryId}`);
    }

    // Step 2: Search for architecture images
    console.log('🔍 Searching for architecture images...');

    let totalIngested = 0;
    const targetCount = 50;
    const searchTerm = 'modern architecture buildings';

    // Calculate pages needed (30 images per page max)
    const pagesNeeded = Math.ceil(targetCount / 30);

    for (let page = 1; page <= pagesNeeded && totalIngested < targetCount; page++) {
      console.log(`📄 Fetching page ${page} for Architecture images...`);

      const searchResults = await unsplash.searchPhotos(
        searchTerm,
        Math.min(30, targetCount - totalIngested),
        page
      );

      console.log(`📸 Found ${searchResults.results.length} images on page ${page}`);

      // Process each image from this page
      for (const unsplashImage of searchResults.results) {
        if (totalIngested >= targetCount) break;

        try {
          console.log(`⬇️ Processing image ${totalIngested + 1}/${targetCount}: ${unsplashImage.id}`);

          // Check if image already exists
          const existingImage = await db.select().from(images).where(eq(images.unsplashId, unsplashImage.id));
          if (existingImage.length > 0) {
            console.log(`⏭️ Skipping duplicate image: ${unsplashImage.id}`);
            continue;
          }

          // Register download with Unsplash (required for API compliance)
          await unsplash.registerDownload(unsplashImage.links.download_location);

          // Get optimized URL (800px width, WebP format)
          const optimizedUrl = unsplash.getOptimizedUrl(unsplashImage, 800, 80);

          // Save to database
          await db.insert(images).values({
            title: unsplashImage.description || unsplashImage.alt_description || 'Architecture Image',
            description: unsplashImage.alt_description || unsplashImage.description,
            imageUrl: optimizedUrl,
            originalUrl: unsplashImage.urls.regular,
            categoryId: architectureCategoryId,
            width: unsplashImage.width,
            height: unsplashImage.height,
            unsplashId: unsplashImage.id,
            unsplashUserId: unsplashImage.user.id,
            unsplashUserName: unsplashImage.user.name,
            unsplashLikes: unsplashImage.likes,
          });

          totalIngested++;
          console.log(`✅ Processed: ${unsplashImage.id} (${totalIngested}/${targetCount} total)`);

          // Small delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
          console.error(`❌ Failed to process image ${unsplashImage.id}:`, error);
          // Continue with next image
        }
      }
    }

    console.log(`\n🎉 Architecture ingestion completed!`);
    console.log(`📊 Total architecture images added: ${totalIngested}/${targetCount}`);

    // Step 3: Show final summary
    const allCategories = await db.select().from(categories);
    const allImages = await db.select().from(images);

    console.log('\n📊 Updated Database Summary:');
    console.log(`Total categories: ${allCategories.length}`);
    console.log(`Total images: ${allImages.length}`);

    for (const category of allCategories) {
      const categoryImages = allImages.filter(img => img.categoryId === category.id);
      console.log(`  ${category.name}: ${categoryImages.length} images`);
    }

  } catch (error) {
    console.error('❌ Failed to add architecture images:', error);
    throw error;
  }
}

// Run the script
addArchitectureImages()
  .then(() => {
    console.log('✅ Architecture image ingestion completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });