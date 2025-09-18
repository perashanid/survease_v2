import mongoose, { Document, Schema } from 'mongoose';

export interface ISurveyQuestion {
  id: string;
  type: 'text' | 'textarea' | 'multiple_choice' | 'checkbox' | 'dropdown' | 'rating' | 'date' | 'email' | 'number';
  question: string;
  required: boolean;
  options?: string[];
  min_rating?: number;
  max_rating?: number;
}

export interface ISurveySettings {
  is_public: boolean;
  allow_anonymous: boolean;
  collect_email: boolean;
  one_response_per_user: boolean;
  show_results: boolean;
  close_date?: Date;
}

export interface ISurveyConfiguration {
  questions: ISurveyQuestion[];
  settings: ISurveySettings;
}

export interface ISurvey extends Document {
  user_id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  slug: string;
  configuration: ISurveyConfiguration;
  is_public: boolean;
  is_active: boolean;
  allow_import: boolean;
  import_count: number;
  original_survey_id?: mongoose.Types.ObjectId;
  start_date?: Date;
  end_date?: Date;
  created_at: Date;
  updated_at: Date;
}

const SurveySchema = new Schema<ISurvey>({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  configuration: {
    questions: [{
      id: { type: String, required: true },
      type: { 
        type: String, 
        required: true,
        enum: ['text', 'textarea', 'multiple_choice', 'checkbox', 'dropdown', 'rating', 'date', 'email', 'number']
      },
      question: { type: String, required: true },
      required: { type: Boolean, default: false },
      options: [String],
      min_rating: Number,
      max_rating: Number
    }],
    settings: {
      is_public: { type: Boolean, default: false },
      allow_anonymous: { type: Boolean, default: true },
      collect_email: { type: Boolean, default: false },
      one_response_per_user: { type: Boolean, default: false },
      show_results: { type: Boolean, default: false },
      close_date: Date
    }
  },
  is_public: {
    type: Boolean,
    default: false
  },
  is_active: {
    type: Boolean,
    default: true
  },
  allow_import: {
    type: Boolean,
    default: true
  },
  import_count: {
    type: Number,
    default: 0
  },
  original_survey_id: {
    type: Schema.Types.ObjectId,
    ref: 'Survey',
    required: false
  },
  start_date: Date,
  end_date: Date
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes for better performance
SurveySchema.index({ user_id: 1 });
// Note: slug index is automatically created by unique: true
SurveySchema.index({ is_public: 1, is_active: 1 });
SurveySchema.index({ is_public: 1, allow_import: 1, is_active: 1 });
SurveySchema.index({ created_at: -1 });
SurveySchema.index({ original_survey_id: 1 });

export const Survey = mongoose.model<ISurvey>('Survey', SurveySchema);