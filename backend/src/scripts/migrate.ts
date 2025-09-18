import { connectDatabase, closeDatabase } from '../config/database';
import { User, Survey, Response, Session } from '../models';

async function runMigrations(): Promise<void> {
  try {
    console.log('📊 Starting MongoDB migration...');
    
    const connected = await connectDatabase();
    if (!connected) {
      throw new Error('Failed to connect to MongoDB');
    }

    // Create indexes (Mongoose will handle this automatically when models are used)
    console.log('📋 Creating indexes...');
    
    // Ensure indexes are created
    await User.createIndexes();
    await Survey.createIndexes();
    await Response.createIndexes();
    await Session.createIndexes();
    
    console.log('✅ MongoDB migration completed successfully');
    console.log('📊 Database indexes created');

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}

export { runMigrations };