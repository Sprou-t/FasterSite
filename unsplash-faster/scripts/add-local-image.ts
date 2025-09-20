import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '../lib/db';
import { images, categories } from '../lib/schema';

async function addLocalImage() {
  try {
    // First, get an existing category ID
    const existingCategories = await db.select().from(categories).limit(1);
    const categoryId = existingCategories[0]?.id || 1;

    // Insert local image
    const newImage = await db.insert(images).values({
      title: 'Local Test Image',
      description: 'Test image stored locally to verify caching behavior',
      imageUrl: '/images/test-image.jpg', // Local path - no Unsplash URL!
      originalUrl: '/images/test-image.jpg',
      categoryId: categoryId,
      width: 800,
      height: 600,
      fileSize: 50000, // 50KB estimate
      unsplashId: 'local-test-' + Date.now(), // Unique ID
      unsplashUserId: 'local',
      unsplashUserName: 'Local User',
      unsplashLikes: 42,
    }).returning();

    console.log('✅ Local image added successfully:', newImage);
    console.log('🖼️ Image URL:', newImage[0].imageUrl);
    console.log('🆔 Image ID:', newImage[0].unsplashId);

  } catch (error) {
    console.error('❌ Error adding local image:', error);
  }
}

addLocalImage();