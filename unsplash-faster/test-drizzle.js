// Test Drizzle ORM connection
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { db } from './lib/db.js';
import { images, categories } from './lib/schema.js';

async function testDrizzle() {
  try {
    console.log('🔍 Testing Drizzle ORM connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Missing');

    // Test basic query
    const imageCount = await db.select().from(images);
    console.log(`📸 Found ${imageCount.length} images via Drizzle`);

    const categoryCount = await db.select().from(categories);
    console.log(`📂 Found ${categoryCount.length} categories via Drizzle`);

    // Test the exact query used in the app
    const allImages = await db.select().from(images);
    const allCategories = await db.select().from(categories);

    console.log('✅ Drizzle queries working properly');
    console.log(`Sample image: ${allImages[0]?.title || 'No images'}`);

  } catch (error) {
    console.error('❌ Drizzle error:', error);
  }
}

testDrizzle();