import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { db } from './db';
import { categories, images } from './schema';

export async function cleanupDatabase() {
  console.log('🧹 Cleaning up database...');

  try {
    // Delete all fake data
    const deletedImages = await db.delete(images);
    console.log('🗑️  Deleted all images from database');

    const deletedCategories = await db.delete(categories);
    console.log('🗑️  Deleted all categories from database');

    console.log('✅ Database cleaned successfully!');
    console.log('📝 Database is now empty and ready for real data in Phase 2/3');

    return {
      message: 'Database cleaned',
      status: 'success'
    };
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    throw error;
  }
}

// Run cleanup if this file is executed directly
if (require.main === module) {
  cleanupDatabase()
    .then((result) => {
      console.log('🎉 Cleanup completed:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Cleanup failed:', error);
      process.exit(1);
    });
}