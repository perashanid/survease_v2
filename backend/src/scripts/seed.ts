import { connectDatabase, closeDatabase } from '../config/database';
import { User, Survey, Response } from '../models';
import bcrypt from 'bcrypt';

async function seedDatabase(): Promise<void> {
  try {
    console.log('🌱 Seeding MongoDB with development data...');
    
    const connected = await connectDatabase();
    if (!connected) {
      throw new Error('Failed to connect to MongoDB');
    }

    // Clear existing data (development only)
    await User.deleteMany({});
    await Survey.deleteMany({});
    await Response.deleteMany({});
    
    console.log('🗑️  Cleared existing data');

    // Create a test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const testUser = new User({
      email: 'test@example.com',
      password_hash: hashedPassword,
      first_name: 'Test',
      last_name: 'User',
      email_verified: true
    });
    
    await testUser.save();
    console.log('👤 Test user created');

    // Create a sample survey
    const sampleSurveyConfig = {
      questions: [
        {
          id: 'q1',
          type: 'text' as const,
          title: 'What is your name?',
          required: true,
          validation: {
            minLength: 2,
            maxLength: 100
          }
        },
        {
          id: 'q2',
          type: 'multiple_choice' as const,
          title: 'What is your favorite color?',
          required: false,
          options: ['Red', 'Blue', 'Green', 'Yellow', 'Other']
        },
        {
          id: 'q3',
          type: 'rating' as const,
          title: 'How would you rate this survey platform?',
          required: true,
          options: ['1', '2', '3', '4', '5']
        }
      ],
      settings: {
        allowAnonymous: true,
        requireLogin: false,
        showProgress: true,
        customStyling: {
          primaryColor: '#007bff',
          backgroundColor: '#ffffff'
        }
      }
    };

    const sampleSurvey = new Survey({
      user_id: testUser._id,
      title: 'Sample Survey',
      description: 'This is a sample survey to test the platform functionality',
      slug: 'sample-survey',
      configuration: sampleSurveyConfig,
      is_public: true,
      is_active: true
    });
    
    await sampleSurvey.save();
    console.log('📋 Sample survey created');

    // Add some sample responses
    const sampleResponses = [
      {
        survey_id: sampleSurvey._id,
        response_data: {
          responses: {
            q1: 'John Doe',
            q2: 'Blue',
            q3: '5'
          },
          metadata: {
            completionTime: 120,
            userAgent: 'Test Browser'
          }
        },
        is_anonymous: true
      },
      {
        survey_id: sampleSurvey._id,
        response_data: {
          responses: {
            q1: 'Jane Smith',
            q2: 'Red',
            q3: '4'
          },
          metadata: {
            completionTime: 95,
            userAgent: 'Test Browser'
          }
        },
        is_anonymous: true
      },
      {
        survey_id: sampleSurvey._id,
        respondent_email: 'user@example.com',
        response_data: {
          responses: {
            q1: 'Alice Johnson',
            q2: 'Green',
            q3: '5'
          },
          metadata: {
            completionTime: 150,
            userAgent: 'Test Browser'
          }
        },
        is_anonymous: false
      }
    ];

    for (const responseData of sampleResponses) {
      const response = new Response(responseData);
      await response.save();
    }
    
    console.log('📊 Sample responses created');

    console.log('✅ Database seeded successfully');
    console.log('📧 Test user: test@example.com / password123');
    console.log('📋 Sample survey: sample-survey');
    console.log('📊 Sample responses: 3 responses (2 anonymous, 1 authenticated)');

  } catch (error: any) {
    console.error('❌ Seeding failed:', error.message);
    throw error;
  } finally {
    await closeDatabase();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { seedDatabase };