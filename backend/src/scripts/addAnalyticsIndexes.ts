import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Response, AnalyticsCache, Segment } from '../models';

dotenv.config();

async function addAnalyticsIndexes() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to database');

    console.log('\nAdding indexes to Response collection...');
    
    // Check existing indexes
    const existingIndexes = await Response.collection.getIndexes();
    console.log('Existing indexes:', Object.keys(existingIndexes));

    // Add compound index for analytics queries
    try {
      await Response.collection.createIndex(
        { survey_id: 1, submitted_at: -1 },
        { name: 'survey_submitted_idx' }
      );
      console.log('✓ Added compound index: survey_id + submitted_at');
    } catch (err: any) {
      if (err.code === 85 || err.codeName === 'IndexOptionsConflict') {
        console.log('✓ Compound index already exists');
      } else {
        throw err;
      }
    }

    // Add device type index
    try {
      await Response.collection.createIndex(
        { 'device_info.type': 1 },
        { name: 'device_type_idx', sparse: true }
      );
      console.log('✓ Added index: device_info.type');
    } catch (err: any) {
      if (err.code === 85 || err.codeName === 'IndexOptionsConflict') {
        console.log('✓ Device type index already exists');
      } else {
        throw err;
      }
    }

    console.log('\nAdding indexes to AnalyticsCache collection...');
    
    // Add cache lookup index
    try {
      await AnalyticsCache.collection.createIndex(
        { survey_id: 1, cache_key: 1 },
        { name: 'cache_lookup_idx', unique: true }
      );
      console.log('✓ Added unique compound index: survey_id + cache_key');
    } catch (err: any) {
      if (err.code === 85 || err.codeName === 'IndexOptionsConflict') {
        console.log('✓ Cache lookup index already exists');
      } else {
        throw err;
      }
    }

    // Add TTL index for cache expiration
    try {
      await AnalyticsCache.collection.createIndex(
        { expires_at: 1 },
        { name: 'cache_ttl_idx', expireAfterSeconds: 0 }
      );
      console.log('✓ Added TTL index: expires_at');
    } catch (err: any) {
      if (err.code === 85 || err.codeName === 'IndexOptionsConflict') {
        console.log('✓ TTL index already exists');
      } else {
        throw err;
      }
    }

    console.log('\nAdding indexes to Segment collection...');
    
    // Add segment lookup indexes
    try {
      await Segment.collection.createIndex(
        { user_id: 1, survey_id: 1 },
        { name: 'user_survey_idx' }
      );
      console.log('✓ Added compound index: user_id + survey_id');
    } catch (err: any) {
      if (err.code === 85 || err.codeName === 'IndexOptionsConflict') {
        console.log('✓ User survey index already exists');
      } else {
        throw err;
      }
    }

    try {
      await Segment.collection.createIndex(
        { survey_id: 1 },
        { name: 'survey_idx' }
      );
      console.log('✓ Added index: survey_id');
    } catch (err: any) {
      if (err.code === 85 || err.codeName === 'IndexOptionsConflict') {
        console.log('✓ Survey index already exists');
      } else {
        throw err;
      }
    }

    console.log('\n✅ All indexes added successfully!');
    console.log('\nFinal index summary:');
    
    const responseIndexes = await Response.collection.getIndexes();
    console.log('\nResponse indexes:', Object.keys(responseIndexes));
    
    const cacheIndexes = await AnalyticsCache.collection.getIndexes();
    console.log('AnalyticsCache indexes:', Object.keys(cacheIndexes));
    
    const segmentIndexes = await Segment.collection.getIndexes();
    console.log('Segment indexes:', Object.keys(segmentIndexes));

  } catch (error) {
    console.error('❌ Error adding indexes:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  }
}

// Run the migration
addAnalyticsIndexes();
