import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { User } from '../src/models/User';

async function makeAdmin(email: string) {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database');

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.error(`❌ User with email "${email}" not found`);
      process.exit(1);
    }

    // Update user to admin
    user.is_admin = true;
    await user.save();

    console.log('✅ User updated successfully!');
    console.log('📧 Email:', user.email);
    console.log('👤 Name:', `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A');
    console.log('🔐 Admin Status:', user.is_admin ? 'YES' : 'NO');
    console.log('\n🎉 User is now an admin!');
    console.log('🔗 Admin Portal: http://localhost:3000/#/x-admin-portal');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from database');
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.log('Usage: npm run make-admin <email>');
  process.exit(1);
}

makeAdmin(email);
