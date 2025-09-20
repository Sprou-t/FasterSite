const postgres = require('postgres');

const sql = postgres('postgresql://neondb_owner:npg_PEpTUGu3x2tH@ep-snowy-rain-a13zsxqv-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');

async function test() {
  try {
    const result = await sql`SELECT 1 as test`;
    console.log('✅ Database connection successful:', result);

    // Test if tables exist
    const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    console.log('📊 Tables:', tables);

    await sql.end();
  } catch (error) {
    console.error('❌ Database error:', error);
  }
}

test();