import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { User } from '../src/models/User';

async function listAdmins() {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database\n');

    // Find all admin users
    const admins = await User.find({ is_admin: true }).select('-password_hash -password_reset_token');
    
    if (admins.length === 0) {
      console.log('❌ No admin users found');
      console.log('\nTo create an admin user, run:');
      console.log('npm run make-admin <email>');
    } else {
      console.log(`🔐 Found ${admins.length} admin user(s):\n`);
      
      admins.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.email}`);
        console.log(`   Name: ${admin.first_name || ''} ${admin.last_name || ''}`.trim() || '   Name: N/A');
        console.log(`   Created: ${admin.created_at.toLocaleDateString()}`);
        console.log(`   Verified: ${admin.email_verified ? 'Yes' : 'No'}`);
        console.log('');
      });
      
      console.log('🔗 Admin Portal: http://localhost:3000/#/x-admin-portal');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from database');
  }
}

listAdmins();
