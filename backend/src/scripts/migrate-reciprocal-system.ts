/**
 * Migration script for reciprocal survey system
 * This script:
 * 1. Adds reciprocal fields to existing responses (all unlocked by default)
 * 2. Adds reciprocal fields to existing surveys
 * 3. Initializes UserPoints for all existing users
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { Response } from '../models/Response';
import { Survey } from '../models/Survey';
import { User } from '../models/User';
import { UserPoints } from '../models/UserPoints';

async function migrateResponses() {
  console.log('\n📝 Migrating existing responses...');
  
  const result = await Response.updateMany(
    {
      is_locked: { $exists: false }
    },
    {
      $set: {
        is_locked: false,
        lock_reason: 'none',
        source_type: 'platform'
      }
    }
  );
  
  console.log(`✅ Updated ${result.modifiedCount} responses`);
}

async function migrateSurveys() {
  console.log('\n📊 Migrating existing surveys...');
  
  // Get all surveys
  const surveys = await Survey.find({
    is_boosted: { $exists: false }
  });
  
  for (const survey of surveys) {
    // Count locked and unlocked responses
    const lockedCount = await Response.countDocuments({
      survey_id: survey._id,
      is_locked: true
    });
    
    const unlockedCount = await Response.countDocuments({
      survey_id: survey._id,
      is_locked: false
    });
    
    await Survey.updateOne(
      { _id: survey._id },
      {
        $set: {
          is_boosted: false,
          locked_response_count: lockedCount,
          unlocked_response_count: unlockedCount
        }
      }
    );
  }
  
  console.log(`✅ Updated ${surveys.length} surveys`);
}

async function initializeUserPoints() {
  console.log('\n💰 Initializing user points...');
  
  const users = await User.find({});
  let created = 0;
  
  for (const user of users) {
    const existingPoints = await UserPoints.findOne({ user_id: user._id });
    
    if (!existingPoints) {
      await UserPoints.create({
        user_id: user._id,
        total_points: 0,
        lifetime_points: 0,
        points_spent: 0
      });
      created++;
    }
  }
  
  console.log(`✅ Created UserPoints for ${created} users`);
}

async function createIndexes() {
  console.log('\n🔍 Creating indexes...');
  
  try {
    // Response indexes
    await Response.collection.createIndex({ is_locked: 1 });
    await Response.collection.createIndex({ source_type: 1 });
    await Response.collection.createIndex({ survey_id: 1, is_locked: 1 });
    console.log('✅ Created Response indexes');
    
    // Survey indexes
    await Survey.collection.createIndex({ is_boosted: 1 });
    await Survey.collection.createIndex({ is_public: 1, is_boosted: 1, is_active: 1 });
    console.log('✅ Created Survey indexes');
    
    // UserPoints indexes
    await UserPoints.collection.createIndex({ user_id: 1 }, { unique: true });
    await UserPoints.collection.createIndex({ total_points: -1 });
    console.log('✅ Created UserPoints indexes');
  } catch (error) {
    console.error('⚠️  Some indexes may already exist:', error);
  }
}

async function runMigration() {
  try {
    console.log('🚀 Starting reciprocal system migration...');
    console.log('📊 Database:', process.env.MONGODB_URI?.split('@')[1] || 'Unknown');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to database');
    
    // Run migrations
    await migrateResponses();
    await migrateSurveys();
    await initializeUserPoints();
    await createIndexes();
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Responses migrated: ${await Response.countDocuments({})}`);
    console.log(`   - Surveys migrated: ${await Survey.countDocuments({})}`);
    console.log(`   - Users with points: ${await UserPoints.countDocuments({})}`);
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from database');
    process.exit(0);
  }
}

// Run migration
runMigration();
