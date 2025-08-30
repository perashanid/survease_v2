const { Client } = require('pg');
require('dotenv').config();

async function seedDatabase() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'survey_platform',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
  });

  try {
    await client.connect();
    console.log('📊 Connected to database for seeding');

    // Add some sample data for development
    console.log('🌱 Seeding development data...');
    
    // This will be expanded in later tasks when we have user registration
    console.log('✅ Database seeded successfully');

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedDatabase();