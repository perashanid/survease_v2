import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Survey } from '../src/models/Survey';
import { Response } from '../src/models/Response';
import { User } from '../src/models/User';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/survey_platform';

// Survey templates with proper questions and topics
const surveyTemplates = [
  {
    title: "Customer Satisfaction Survey 2024",
    description: "Help us improve our services by sharing your experience with our products and customer support.",
    tags: ["customer-satisfaction", "feedback", "service-quality"],
    is_featured: true,
    responseCount: 150,
    questions: [
      {
        type: 'rating' as const,
        question: 'How satisfied are you with our product overall?',
        required: true,
        min_rating: 1,
        max_rating: 5
      },
      {
        type: 'multiple_choice' as const,
        question: 'How often do you use our product?',
        required: true,
        options: ['Daily', 'Weekly', 'Monthly', 'Rarely', 'First time']
      },
      {
        type: 'rating' as const,
        question: 'How would you rate our customer support?',
        required: true,
        min_rating: 1,
        max_rating: 5
      },
      {
        type: 'multiple_choice' as const,
        question: 'Would you recommend our product to others?',
        required: true,
        options: ['Definitely yes', 'Probably yes', 'Not sure', 'Probably not', 'Definitely not']
      },
      {
        type: 'textarea' as const,
        question: 'What features would you like to see improved?',
        required: false
      }
    ]
  },
  {
    title: "Employee Engagement Survey",
    description: "Your feedback helps us create a better workplace. All responses are confidential.",
    tags: ["hr", "employee-engagement", "workplace", "trending"],
    is_featured: false,
    responseCount: 89,
    questions: [
      {
        type: 'rating' as const,
        question: 'How satisfied are you with your current role?',
        required: true,
        min_rating: 1,
        max_rating: 10
      },
      {
        type: 'multiple_choice' as const,
        question: 'Do you feel valued at work?',
        required: true,
        options: ['Always', 'Often', 'Sometimes', 'Rarely', 'Never']
      },
      {
        type: 'rating' as const,
        question: 'How would you rate work-life balance?',
        required: true,
        min_rating: 1,
        max_rating: 10
      },
      {
        type: 'checkbox' as const,
        question: 'What benefits are most important to you? (Select all that apply)',
        required: true,
        options: ['Health insurance', 'Flexible hours', 'Remote work', 'Professional development', 'Retirement plans', 'Paid time off']
      },
      {
        type: 'textarea' as const,
        question: 'What would make you more engaged at work?',
        required: false
      }
    ]
  },
  {
    title: "Market Research: Tech Preferences 2024",
    description: "Share your technology preferences and help shape the future of our products.",
    tags: ["market-research", "technology", "consumer-behavior", "trending"],
    is_featured: true,
    responseCount: 200,
    questions: [
      {
        type: 'multiple_choice' as const,
        question: 'What is your primary device for internet browsing?',
        required: true,
        options: ['Smartphone', 'Laptop', 'Desktop', 'Tablet', 'Smart TV']
      },
      {
        type: 'checkbox' as const,
        question: 'Which social media platforms do you use regularly? (Select all)',
        required: true,
        options: ['Facebook', 'Instagram', 'Twitter/X', 'LinkedIn', 'TikTok', 'YouTube', 'Reddit', 'Snapchat']
      },
      {
        type: 'rating' as const,
        question: 'How important is data privacy to you?',
        required: true,
        min_rating: 1,
        max_rating: 5
      },
      {
        type: 'multiple_choice' as const,
        question: 'How much do you spend on tech products monthly?',
        required: true,
        options: ['Under $50', '$50-$100', '$100-$200', '$200-$500', 'Over $500']
      },
      {
        type: 'textarea' as const,
        question: 'What emerging technology are you most excited about?',
        required: false
      }
    ]
  },
  {
    title: "Healthcare Experience Survey",
    description: "Help us improve healthcare services by sharing your recent experience.",
    tags: ["healthcare", "patient-experience", "medical"],
    is_featured: false,
    responseCount: 120,
    questions: [
      {
        type: 'rating' as const,
        question: 'How would you rate your overall healthcare experience?',
        required: true,
        min_rating: 1,
        max_rating: 5
      },
      {
        type: 'multiple_choice' as const,
        question: 'How long did you wait for your appointment?',
        required: true,
        options: ['Less than 15 minutes', '15-30 minutes', '30-60 minutes', '1-2 hours', 'More than 2 hours']
      },
      {
        type: 'rating' as const,
        question: 'How satisfied were you with the medical staff?',
        required: true,
        min_rating: 1,
        max_rating: 5
      },
      {
        type: 'multiple_choice' as const,
        question: 'Was the facility clean and well-maintained?',
        required: true,
        options: ['Excellent', 'Good', 'Average', 'Poor', 'Very Poor']
      },
      {
        type: 'textarea' as const,
        question: 'Any suggestions for improvement?',
        required: false
      }
    ]
  },
  {
    title: "Online Shopping Behavior Study",
    description: "Tell us about your online shopping habits and preferences.",
    tags: ["e-commerce", "shopping", "consumer-behavior", "trending"],
    is_featured: false,
    responseCount: 175,
    questions: [
      {
        type: 'multiple_choice' as const,
        question: 'How often do you shop online?',
        required: true,
        options: ['Daily', 'Several times a week', 'Weekly', 'Monthly', 'Rarely']
      },
      {
        type: 'checkbox' as const,
        question: 'What do you typically buy online? (Select all)',
        required: true,
        options: ['Clothing', 'Electronics', 'Groceries', 'Books', 'Home goods', 'Beauty products', 'Toys', 'Sports equipment']
      },
      {
        type: 'rating' as const,
        question: 'How important is free shipping to your purchase decision?',
        required: true,
        min_rating: 1,
        max_rating: 5
      },
      {
        type: 'multiple_choice' as const,
        question: 'What is your preferred payment method?',
        required: true,
        options: ['Credit card', 'Debit card', 'PayPal', 'Digital wallet', 'Buy now, pay later', 'Cash on delivery']
      },
      {
        type: 'textarea' as const,
        question: 'What frustrates you most about online shopping?',
        required: false
      }
    ]
  },
  {
    title: "Remote Work Productivity Survey",
    description: "Share your experience with remote work and help us understand productivity patterns.",
    tags: ["remote-work", "productivity", "work-from-home"],
    is_featured: false,
    responseCount: 95,
    questions: [
      {
        type: 'multiple_choice' as const,
        question: 'How long have you been working remotely?',
        required: true,
        options: ['Less than 6 months', '6-12 months', '1-2 years', '2-3 years', 'More than 3 years']
      },
      {
        type: 'rating' as const,
        question: 'How productive do you feel working from home?',
        required: true,
        min_rating: 1,
        max_rating: 10
      },
      {
        type: 'checkbox' as const,
        question: 'What challenges do you face? (Select all)',
        required: true,
        options: ['Distractions at home', 'Poor internet connection', 'Lack of social interaction', 'Difficulty separating work and personal life', 'Communication issues', 'Technical problems']
      },
      {
        type: 'multiple_choice' as const,
        question: 'Would you prefer to continue working remotely?',
        required: true,
        options: ['Yes, full-time remote', 'Hybrid (some days remote)', 'No, prefer office', 'No preference']
      },
      {
        type: 'textarea' as const,
        question: 'What tools or resources would improve your remote work experience?',
        required: false
      }
    ]
  },
  {
    title: "Food Delivery Service Feedback",
    description: "Rate your recent food delivery experience and help us serve you better.",
    tags: ["food-delivery", "customer-service", "feedback"],
    is_featured: false,
    responseCount: 160,
    questions: [
      {
        type: 'rating' as const,
        question: 'How satisfied were you with your order?',
        required: true,
        min_rating: 1,
        max_rating: 5
      },
      {
        type: 'multiple_choice' as const,
        question: 'How was the delivery time?',
        required: true,
        options: ['Faster than expected', 'On time', 'Slightly delayed', 'Very delayed', 'Extremely late']
      },
      {
        type: 'rating' as const,
        question: 'How would you rate the food quality?',
        required: true,
        min_rating: 1,
        max_rating: 5
      },
      {
        type: 'multiple_choice' as const,
        question: 'Was the order accurate?',
        required: true,
        options: ['Perfect', 'Minor issues', 'Missing items', 'Wrong order', 'Damaged items']
      },
      {
        type: 'textarea' as const,
        question: 'Additional comments or suggestions?',
        required: false
      }
    ]
  },
  {
    title: "Student Learning Experience Survey",
    description: "Help us improve education quality by sharing your learning experience.",
    tags: ["education", "student-feedback", "learning"],
    is_featured: false,
    responseCount: 110,
    questions: [
      {
        type: 'multiple_choice' as const,
        question: 'What is your current education level?',
        required: true,
        options: ['High School', 'Undergraduate', 'Graduate', 'Postgraduate', 'Professional Course']
      },
      {
        type: 'rating' as const,
        question: 'How engaging are your classes?',
        required: true,
        min_rating: 1,
        max_rating: 10
      },
      {
        type: 'checkbox' as const,
        question: 'What learning methods work best for you? (Select all)',
        required: true,
        options: ['Lectures', 'Group discussions', 'Hands-on projects', 'Online videos', 'Reading materials', 'Interactive quizzes']
      },
      {
        type: 'rating' as const,
        question: 'How accessible are your instructors?',
        required: true,
        min_rating: 1,
        max_rating: 5
      },
      {
        type: 'textarea' as const,
        question: 'What would improve your learning experience?',
        required: false
      }
    ]
  },
  {
    title: "Fitness and Wellness Survey",
    description: "Share your fitness journey and wellness goals with us.",
    tags: ["fitness", "wellness", "health", "lifestyle"],
    is_featured: false,
    responseCount: 85,
    questions: [
      {
        type: 'multiple_choice' as const,
        question: 'How often do you exercise?',
        required: true,
        options: ['Daily', '4-6 times a week', '2-3 times a week', 'Once a week', 'Rarely', 'Never']
      },
      {
        type: 'checkbox' as const,
        question: 'What types of exercise do you do? (Select all)',
        required: true,
        options: ['Running', 'Gym/Weight training', 'Yoga', 'Swimming', 'Cycling', 'Sports', 'Walking', 'Dance']
      },
      {
        type: 'rating' as const,
        question: 'How important is fitness to your lifestyle?',
        required: true,
        min_rating: 1,
        max_rating: 10
      },
      {
        type: 'multiple_choice' as const,
        question: 'What motivates you to stay fit?',
        required: true,
        options: ['Health benefits', 'Weight management', 'Stress relief', 'Social activity', 'Competition', 'Appearance']
      },
      {
        type: 'textarea' as const,
        question: 'What are your biggest fitness challenges?',
        required: false
      }
    ]
  },
  {
    title: "Travel Preferences Survey 2024",
    description: "Tell us about your travel habits and dream destinations.",
    tags: ["travel", "tourism", "vacation", "lifestyle"],
    is_featured: false,
    responseCount: 130,
    questions: [
      {
        type: 'multiple_choice' as const,
        question: 'How often do you travel for leisure?',
        required: true,
        options: ['Multiple times a year', 'Once a year', 'Every 2-3 years', 'Rarely', 'Never']
      },
      {
        type: 'checkbox' as const,
        question: 'What type of destinations do you prefer? (Select all)',
        required: true,
        options: ['Beach resorts', 'Mountain retreats', 'City tours', 'Historical sites', 'Adventure destinations', 'Countryside', 'Theme parks']
      },
      {
        type: 'rating' as const,
        question: 'How important is budget when planning travel?',
        required: true,
        min_rating: 1,
        max_rating: 5
      },
      {
        type: 'multiple_choice' as const,
        question: 'How do you prefer to book travel?',
        required: true,
        options: ['Online travel agencies', 'Direct booking', 'Travel agent', 'Package deals', 'Last minute deals']
      },
      {
        type: 'textarea' as const,
        question: 'What is your dream travel destination and why?',
        required: false
      }
    ]
  },
  {
    title: "Social Media Usage and Impact Study",
    description: "Help us understand how social media affects daily life and well-being.",
    tags: ["social-media", "digital-wellness", "technology"],
    is_featured: false,
    responseCount: 180,
    questions: [
      {
        type: 'multiple_choice' as const,
        question: 'How many hours per day do you spend on social media?',
        required: true,
        options: ['Less than 1 hour', '1-2 hours', '2-4 hours', '4-6 hours', 'More than 6 hours']
      },
      {
        type: 'rating' as const,
        question: 'How much does social media impact your mood?',
        required: true,
        min_rating: 1,
        max_rating: 10
      },
      {
        type: 'checkbox' as const,
        question: 'Why do you use social media? (Select all)',
        required: true,
        options: ['Stay connected with friends', 'News and information', 'Entertainment', 'Professional networking', 'Shopping', 'Content creation', 'Following influencers']
      },
      {
        type: 'multiple_choice' as const,
        question: 'Have you ever taken a social media break?',
        required: true,
        options: ['Yes, regularly', 'Yes, occasionally', 'Once or twice', 'Never, but considering', 'Never']
      },
      {
        type: 'textarea' as const,
        question: 'How has social media positively or negatively affected your life?',
        required: false
      }
    ]
  }
];

// Helper function to generate realistic responses
function generateResponses(survey: any, count: number, surveyId: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId) {
  const responses = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const submittedDate = new Date(now.getTime() - Math.random() * 90 * 24 * 60 * 60 * 1000); // Random date within last 90 days
    const completionTime = Math.floor(Math.random() * 600) + 60; // 60-660 seconds
    
    const responseData: any = { responses: {} };
    
    survey.questions.forEach((q: any, index: number) => {
      const questionId = `q${index + 1}`;
      
      switch (q.type) {
        case 'rating':
          // Generate realistic rating distribution (skewed towards higher ratings)
          const ratingRandom = Math.random();
          let rating;
          if (ratingRandom < 0.4) rating = q.max_rating;
          else if (ratingRandom < 0.7) rating = q.max_rating - 1;
          else if (ratingRandom < 0.85) rating = Math.ceil(q.max_rating / 2);
          else rating = Math.floor(Math.random() * q.max_rating) + 1;
          responseData.responses[questionId] = rating;
          break;
          
        case 'multiple_choice':
          const choiceIndex = Math.floor(Math.random() * q.options.length);
          responseData.responses[questionId] = q.options[choiceIndex];
          break;
          
        case 'checkbox':
          const numSelections = Math.floor(Math.random() * Math.min(3, q.options.length)) + 1;
          const selectedOptions = [];
          const availableOptions = [...q.options];
          for (let j = 0; j < numSelections; j++) {
            const idx = Math.floor(Math.random() * availableOptions.length);
            selectedOptions.push(availableOptions[idx]);
            availableOptions.splice(idx, 1);
          }
          responseData.responses[questionId] = selectedOptions;
          break;
          
        case 'textarea':
        case 'text':
          // 70% chance of providing text response for optional questions
          if (!q.required && Math.random() > 0.7) {
            responseData.responses[questionId] = '';
          } else {
            const textResponses = [
              'Great experience overall, very satisfied.',
              'Could be better, but acceptable.',
              'Excellent service, highly recommend!',
              'Some improvements needed in certain areas.',
              'Very professional and efficient.',
              'Met my expectations perfectly.',
              'Outstanding quality and attention to detail.',
              'Good value for money.',
              'Quick and easy process.',
              'Will definitely use again.'
            ];
            responseData.responses[questionId] = textResponses[Math.floor(Math.random() * textResponses.length)];
          }
          break;
          
        default:
          responseData.responses[questionId] = 'N/A';
      }
    });
    
    // Device distribution
    const deviceTypes = ['desktop', 'mobile', 'tablet'];
    const deviceWeights = [0.5, 0.4, 0.1]; // 50% desktop, 40% mobile, 10% tablet
    const deviceRandom = Math.random();
    let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
    if (deviceRandom < deviceWeights[2]) deviceType = 'tablet';
    else if (deviceRandom < deviceWeights[1] + deviceWeights[2]) deviceType = 'mobile';
    
    const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
    const os = deviceType === 'mobile' ? ['iOS', 'Android'][Math.floor(Math.random() * 2)] : ['Windows', 'macOS', 'Linux'][Math.floor(Math.random() * 3)];
    
    responses.push({
      survey_id: surveyId,
      user_id: Math.random() > 0.3 ? userId : undefined, // 70% authenticated, 30% anonymous
      response_data: responseData,
      is_anonymous: Math.random() > 0.7,
      submitted_at: submittedDate,
      completion_time: completionTime,
      started_at: new Date(submittedDate.getTime() - completionTime * 1000),
      device_info: {
        type: deviceType,
        os: os,
        browser: browsers[Math.floor(Math.random() * browsers.length)],
        browserVersion: `${Math.floor(Math.random() * 20) + 90}.0`
      },
      quality_status: Math.random() > 0.95 ? 'low_quality' : 'quality', // 5% low quality
      quality_flags: []
    });
  }
  
  return responses;
}

async function seedDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Step 1: Delete all existing surveys and responses
    console.log('\n🗑️  Deleting all existing surveys...');
    const deletedSurveys = await Survey.deleteMany({});
    console.log(`✅ Deleted ${deletedSurveys.deletedCount} surveys`);
    
    console.log('🗑️  Deleting all existing responses...');
    const deletedResponses = await Response.deleteMany({});
    console.log(`✅ Deleted ${deletedResponses.deletedCount} responses`);
    
    // Step 2: Get or create a user for the surveys
    let user = await User.findOne();
    if (!user) {
      console.log('\n⚠️  No users found. Please create a user first.');
      process.exit(1);
    }
    console.log(`\n👤 Using user: ${user.email}`);
    
    // Step 3: Create surveys with responses
    console.log('\n📝 Creating 11 new surveys with responses...\n');
    
    let featuredCount = 0;
    let trendingCount = 0;
    
    for (let i = 0; i < surveyTemplates.length; i++) {
      const template = surveyTemplates[i];
      
      // Determine if survey should be featured or trending
      let isFeatured = template.is_featured;
      let isTrending = template.tags.includes('trending');
      
      // Ensure we have exactly 2 featured
      if (isFeatured && featuredCount < 2) {
        featuredCount++;
      } else if (isFeatured) {
        isFeatured = false;
      }
      
      // Ensure we have exactly 3 trending
      if (isTrending && trendingCount < 3) {
        trendingCount++;
      } else if (isTrending) {
        isTrending = false;
        template.tags = template.tags.filter(tag => tag !== 'trending');
      }
      
      // Create survey
      const survey = new Survey({
        user_id: user._id,
        title: template.title,
        description: template.description,
        slug: template.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        tags: template.tags,
        configuration: {
          questions: template.questions.map((q, idx) => ({
            id: `q${idx + 1}`,
            ...q
          })),
          settings: {
            is_public: true,
            allow_anonymous: true,
            collect_email: false,
            one_response_per_user: false,
            show_results: true
          }
        },
        is_public: true,
        is_active: true,
        is_featured: isFeatured,
        allow_import: true,
        import_count: Math.floor(Math.random() * 20)
      });
      
      await survey.save();
      console.log(`✅ Created survey: "${template.title}" (${template.responseCount} responses)`);
      if (isFeatured) console.log('   ⭐ Featured');
      if (isTrending) console.log('   🔥 Trending');
      
      // Generate and save responses
      const responses = generateResponses(template, template.responseCount, survey._id as mongoose.Types.ObjectId, user._id as mongoose.Types.ObjectId);
      await Response.insertMany(responses);
      console.log(`   📊 Added ${responses.length} responses\n`);
    }
    
    console.log('✅ Database seeding completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Total surveys created: 11`);
    console.log(`   - Featured surveys: 2`);
    console.log(`   - Trending surveys: 3`);
    console.log(`   - Total responses: ${surveyTemplates.reduce((sum, t) => sum + t.responseCount, 0)}`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n📊 Database connection closed');
  }
}

// Run the seed script
seedDatabase();
