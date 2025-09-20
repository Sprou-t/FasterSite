const postgres = require('postgres');

const sql = postgres('postgresql://neondb_owner:npg_PEpTUGu3x2tH@ep-snowy-rain-a13zsxqv-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');

async function checkSchema() {
  try {
    const columns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'images'
      ORDER BY ordinal_position
    `;

    console.log('📊 Images table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });

    await sql.end();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkSchema();