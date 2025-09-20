const postgres = require('postgres');

const DATABASE_URL = 'postgresql://neondb_owner:npg_PEpTUGu3x2tH@ep-snowy-rain-a13zsxqv-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const UNSPLASH_ACCESS_KEY = 'yaO7KUuxzbAK3c9hH38m-tDscWX_FameDcuBQh0voeM';

// Create new fresh connection
const sql = postgres(DATABASE_URL, {
  prepare: false, // Disable prepared statements to avoid plan cache issues
});

const SEARCH_CATEGORIES = [
  { slug: 'nature', name: 'Nature', searchTerm: 'nature landscape mountains', count: 50 },
  { slug: 'architecture', name: 'Architecture', searchTerm: 'modern architecture buildings', count: 40 },
  { slug: 'technology', name: 'Technology', searchTerm: 'technology computer coding', count: 30 },
  { slug: 'travel', name: 'Travel', searchTerm: 'travel destinations cities', count: 40 },
  { slug: 'lifestyle', name: 'Lifestyle', searchTerm: 'lifestyle people coffee', count: 40 },
];

async function unsplashFetch(endpoint, params = {}) {
  const url = new URL(`https://api.unsplash.com${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
      'Accept-Version': 'v1',
    },
  });

  if (!response.ok) {
    if (response.status === 403) {
      console.log('⏳ Rate limit hit, waiting 60 seconds...');
      await new Promise(resolve => setTimeout(resolve, 60000));
      // Retry after waiting
      return unsplashFetch(endpoint, params);
    }
    throw new Error(`Unsplash API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function registerDownload(downloadUrl) {
  await fetch(downloadUrl, {
    headers: {
      'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
    },
  });
}

function getOptimizedUrl(image, width = 800, quality = 80) {
  return `${image.urls.raw}&w=${width}&q=${quality}&fm=webp&fit=crop`;
}

async function ingestImages() {
  console.log('🚀 Starting UnsplashFaster ingestion for 200 images...');

  try {
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await sql`DELETE FROM images`;
    await sql`DELETE FROM categories`;

    // Create categories
    console.log('📂 Creating categories...');
    const categories = [];
    for (const cat of SEARCH_CATEGORIES) {
      const result = await sql`
        INSERT INTO categories (name, slug)
        VALUES (${cat.name}, ${cat.slug})
        RETURNING id, slug
      `;
      categories.push(result[0]);
    }

    const categoryMap = categories.reduce((map, cat) => {
      map[cat.slug] = cat.id;
      return map;
    }, {});

    console.log(`✅ Created ${categories.length} categories`);

    let totalIngested = 0;

    // Process each category
    for (const category of SEARCH_CATEGORIES) {
      console.log(`\n🔍 Processing category: ${category.name} (target: ${category.count} images)`);

      try {
        const pagesNeeded = Math.ceil(category.count / 30);
        let categoryIngested = 0;

        for (let page = 1; page <= pagesNeeded && categoryIngested < category.count; page++) {
          console.log(`📄 Fetching page ${page} for ${category.name}...`);

          const searchResults = await unsplashFetch('/search/photos', {
            query: category.searchTerm,
            per_page: Math.min(30, category.count - categoryIngested).toString(),
            page: page.toString(),
            order_by: 'relevant',
          });

          console.log(`📸 Found ${searchResults.results.length} images on page ${page}`);

          for (const unsplashImage of searchResults.results) {
            if (categoryIngested >= category.count) break;

            try {
              console.log(`⬇️ Processing image ${categoryIngested + 1}/${category.count}: ${unsplashImage.id}`);

              // Register download
              await registerDownload(unsplashImage.links.download_location);

              // Get optimized URL
              const optimizedUrl = getOptimizedUrl(unsplashImage, 800, 80);

              // Save to database with explicit column list matching schema
              await sql`
                INSERT INTO images (
                  title,
                  description,
                  image_url,
                  original_url,
                  category_id,
                  width,
                  height,
                  file_size,
                  unsplash_id,
                  unsplash_user_id,
                  unsplash_user_name,
                  unsplash_likes
                ) VALUES (
                  ${unsplashImage.description || unsplashImage.alt_description || `${category.name} Image`},
                  ${unsplashImage.alt_description || unsplashImage.description || ''},
                  ${optimizedUrl},
                  ${unsplashImage.urls.regular},
                  ${categoryMap[category.slug]},
                  ${unsplashImage.width},
                  ${unsplashImage.height},
                  ${0},
                  ${unsplashImage.id},
                  ${unsplashImage.user.id},
                  ${unsplashImage.user.name},
                  ${unsplashImage.likes || 0}
                )
              `;

              categoryIngested++;
              totalIngested++;
              console.log(`✅ Processed: ${unsplashImage.id} (${totalIngested}/200 total)`);

              // Longer delay to respect rate limits
              await new Promise(resolve => setTimeout(resolve, 2000));

            } catch (error) {
              console.error(`❌ Failed to process image ${unsplashImage.id}:`, error);
            }
          }
        }

        console.log(`✅ Completed category: ${category.name} (${categoryIngested} images)`);

      } catch (error) {
        console.error(`❌ Failed to process category ${category.name}:`, error);
      }
    }

    console.log(`\n🎉 Ingestion completed successfully!`);
    console.log(`📊 Total images ingested: ${totalIngested}/200`);

    // Get final counts
    const finalImages = await sql`SELECT COUNT(*) as count FROM images`;
    const finalCategories = await sql`SELECT COUNT(*) as count FROM categories`;

    console.log('🎉 Final Summary:', {
      success: true,
      categories: parseInt(finalCategories[0].count),
      images: parseInt(finalImages[0].count),
    });

  } catch (error) {
    console.error('💥 Ingestion failed:', error);
  } finally {
    await sql.end();
  }
}

ingestImages();