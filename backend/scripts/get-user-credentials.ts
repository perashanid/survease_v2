import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../src/models/User';
import { Survey } from '../src/models/Survey';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/survey_platform';

async function getUserCredentials() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Get all users
    const users = await User.find();
    
    if (users.length === 0) {
      console.log('⚠️  No users found in the database.');
      return;
    }
    
    console.log(`📋 Found ${users.length} user(s):\n`);
    
    for (const user of users) {
      // Count surveys created by this user
      const surveyCount = await Survey.countDocuments({ user_id: user._id });
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`👤 User ID: ${user._id}`);
      console.log(`📧 Email: ${user.email}`);
      console.log(`👤 Name: ${user.first_name || 'N/A'} ${user.last_name || 'N/A'}`);
      console.log(`📊 Surveys Created: ${surveyCount}`);
      console.log(`📅 Created At: ${user.created_at}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      if (surveyCount > 0) {
        console.log('⭐ This user created the surveys!');
        console.log('\n🔑 LOGIN CREDENTIALS:');
        console.log(`   Email: ${user.email}`);
        console.log(`   Password: [You need to know the password you used when registering]\n`);
        console.log('💡 If you forgot the password, you can:');
        console.log('   1. Use the "Forgot Password" feature on the login page');
        console.log('   2. Or run the reset-password script to set a new password\n');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📊 Database connection closed');
  }
}

getUserCredentials();
