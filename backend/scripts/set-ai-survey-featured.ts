import mongoose from 'mongoose';
import { Survey } from '../src/models/Survey';
import dotenv from 'dotenv';

dotenv.config();

async function setAISurveyFeatured() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/survey-platform';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find survey with "AI" in the title (case insensitive)
    const aiSurvey = await Survey.findOne({ 
      title: { $regex: /ai/i },
      is_public: true 
    });

    if (!aiSurvey) {
      console.log('No AI survey found. Looking for any public survey...');
      
      // If no AI survey, just feature the first public survey
      const anySurvey = await Survey.findOne({ is_public: true });
      
      if (anySurvey) {
        anySurvey.is_featured = true;
        await anySurvey.save();
        console.log(`Set survey "${anySurvey.title}" as featured`);
      } else {
        console.log('No public surveys found');
      }
    } else {
      aiSurvey.is_featured = true;
      await aiSurvey.save();
      console.log(`Set AI survey "${aiSurvey.title}" as featured`);
    }

    await mongoose.disconnect();
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

setAISurveyFeatured();
