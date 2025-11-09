import mongoose from 'mongoose';
import dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import { User } from '../src/models/User';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/survey_platform';

async function resetPassword() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Get the specific user (survey creator)
    const user = await User.findOne({ email: 'seventhuser@gmail.com' });
    
    if (!user) {
      console.log('⚠️  User not found in the database.');
      return;
    }
    
    console.log(`👤 Found user: ${user.email}`);
    console.log(`👤 Name: ${user.first_name} ${user.last_name}\n`);
    
    // Set new password
    const newPassword = 'Password123!';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    user.password_hash = hashedPassword;
    await user.save();
    
    console.log('✅ Password reset successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔑 NEW LOGIN CREDENTIALS:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: ${newPassword}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('⚠️  IMPORTANT: Change this password after logging in!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n📊 Database connection closed');
  }
}

resetPassword();
