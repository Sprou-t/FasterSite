const postgres = require('postgres');

const sql = postgres('postgresql://neondb_owner:npg_PEpTUGu3x2tH@ep-snowy-rain-a13zsxqv-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');

async function debugDatabase() {
  try {
    console.log('🔍 Debugging database contents...');

    // Check images table
    const imageCount = await sql`SELECT COUNT(*) as count FROM images`;
    console.log(`📸 Total images: ${imageCount[0].count}`);

    // Check categories table
    const categoryCount = await sql`SELECT COUNT(*) as count FROM categories`;
    console.log(`📂 Total categories: ${categoryCount[0].count}`);

    // Show sample images
    const sampleImages = await sql`SELECT id, title, image_url, category_id FROM images LIMIT 3`;
    console.log('📋 Sample images:');
    sampleImages.forEach((img, i) => {
      console.log(`  ${i+1}. ID: ${img.id}, Title: ${img.title}, Category: ${img.category_id}`);
      console.log(`     URL: ${img.image_url.substring(0, 60)}...`);
    });

    // Show categories
    const categories = await sql`SELECT * FROM categories`;
    console.log('📁 Categories:');
    categories.forEach(cat => {
      console.log(`  - ${cat.id}: ${cat.name} (${cat.slug})`);
    });

    await sql.end();
  } catch (error) {
    console.error('❌ Database error:', error);
  }
}

debugDatabase();