// Load environment variables FIRST before any other imports
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// Now import everything else
import { db } from '../lib/db';
import { categories, images } from '../lib/schema';
import { eq } from 'drizzle-orm';

async function addCategoriesToExistingImages() {
  console.log('🏷️ Adding categories to existing images...');

  try {
    // Step 1: Create the "nature" category if it doesn't exist
    console.log('📂 Creating "nature" category...');

    const existingNature = await db.select().from(categories).where(eq(categories.slug, 'nature'));

    let natureCategoryId: number;

    if (existingNature.length === 0) {
      const [natureCategory] = await db.insert(categories).values({
        slug: 'nature',
        name: 'Nature'
      }).returning();
      natureCategoryId = natureCategory.id;
      console.log(`✅ Created "nature" category with ID: ${natureCategoryId}`);
    } else {
      natureCategoryId = existingNature[0].id;
      console.log(`✅ Found existing "nature" category with ID: ${natureCategoryId}`);
    }

    // Step 2: Get all images that don't have a category (categoryId is null)
    const uncategorizedImages = await db.select().from(images).where(eq(images.categoryId, null as any));
    console.log(`📸 Found ${uncategorizedImages.length} uncategorized images`);

    // Step 3: Update all uncategorized images to have the nature category
    if (uncategorizedImages.length > 0) {
      for (const image of uncategorizedImages) {
        await db.update(images)
          .set({ categoryId: natureCategoryId })
          .where(eq(images.id, image.id));
        console.log(`✅ Updated image ${image.id}: "${image.title}" to nature category`);
      }
    }

    console.log(`🎉 Successfully categorized ${uncategorizedImages.length} images as "nature"`);

    // Step 4: Show summary
    const allCategories = await db.select().from(categories);
    const allImages = await db.select().from(images);

    console.log('\n📊 Current Database Summary:');
    console.log(`Total categories: ${allCategories.length}`);
    console.log(`Total images: ${allImages.length}`);

    for (const category of allCategories) {
      const categoryImages = allImages.filter(img => img.categoryId === category.id);
      console.log(`  ${category.name}: ${categoryImages.length} images`);
    }

  } catch (error) {
    console.error('❌ Failed to add categories:', error);
    throw error;
  }
}

// Run the script
addCategoriesToExistingImages()
  .then(() => {
    console.log('✅ Category assignment completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });