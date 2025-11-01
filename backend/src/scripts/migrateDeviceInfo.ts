import { connectDatabase } from '../config/database';
import { Response } from '../models';
import { parseUserAgent } from '../utils/deviceDetection';

async function migrateDeviceInfo() {
  try {
    console.log('🔄 Starting device info migration...');
    
    await connectDatabase();
    
    // Find all responses without device_info
    const responsesWithoutDevice = await Response.find({
      $or: [
        { device_info: { $exists: false } },
        { device_info: null }
      ]
    });
    
    console.log(`📊 Found ${responsesWithoutDevice.length} responses without device info`);
    
    let updated = 0;
    
    for (const response of responsesWithoutDevice) {
      // Check if we have user agent in metadata
      const userAgent = response.response_data?.metadata?.userAgent;
      
      let deviceInfo;
      if (userAgent) {
        // Parse from stored user agent
        deviceInfo = parseUserAgent(userAgent);
      } else {
        // Set default device info for old responses
        deviceInfo = {
          type: 'desktop' as const,
          os: 'Unknown',
          browser: 'Unknown',
          browserVersion: ''
        };
      }
      
      response.device_info = deviceInfo;
      await response.save();
      updated++;
      
      if (updated % 100 === 0) {
        console.log(`✅ Updated ${updated} responses...`);
      }
    }
    
    console.log(`✅ Migration complete! Updated ${updated} responses`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateDeviceInfo();
