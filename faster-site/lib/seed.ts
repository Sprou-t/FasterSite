import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { db } from './db';
import { categories, images } from './schema';
import { userProvidedImages } from '../data/mockData';

export async function seedDatabase() {
  console.log('🌱 Seeding database...');

  try {
    // Clear existing data
    await db.delete(images);
    await db.delete(categories);
    console.log('🧹 Cleared existing data');

    // Insert categories
    const categoryData = [
      { slug: 'nature', name: 'Nature' },
      { slug: 'architecture', name: 'Architecture' },
      { slug: 'technology', name: 'Technology' },
    ];

    const insertedCategories = await db.insert(categories).values(categoryData).returning();
    console.log('📂 Created categories:', insertedCategories.length);

    // Create category lookup map
    const categoryMap = insertedCategories.reduce((map, cat) => {
      map[cat.slug] = cat.id;
      return map;
    }, {} as Record<string, number>);

    // Insert images - create 20 copies of each base image (100 total)
    const imageData = [];
    let imageId = 1;

    for (let round = 0; round < 20; round++) {
      for (const baseImage of userProvidedImages) {
        imageData.push({
          title: `${baseImage.title} ${round + 1}`,
          description: baseImage.description,
          s3Key: `images/${baseImage.filename}`,
          s3Url: `/images/${baseImage.filename}`,
          categoryId: categoryMap[baseImage.category],
          width: baseImage.width,
          height: baseImage.height,
          fileSize: 150000, // ~150KB
          contentHash: `img${imageId.toString().padStart(3, '0')}`,
        });
        imageId++;
      }
    }

    const insertedImages = await db.insert(images).values(imageData).returning();
    console.log('🖼️  Created images:', insertedImages.length);

    console.log('✅ Database seeded successfully!');
    return {
      categories: insertedCategories.length,
      images: insertedImages.length,
    };
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then((result) => {
      console.log('🎉 Seed completed:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seed failed:', error);
      process.exit(1);
    });
}