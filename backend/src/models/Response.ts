import mongoose, { Document, Schema } from 'mongoose';

export interface IResponseData {
  responses: { [questionId: string]: any };
  metadata?: {
    completionTime?: number;
    userAgent?: string;
    referrer?: string;
    startTime?: Date;
    endTime?: Date;
  };
}

export interface IResponse extends Document {
  survey_id: mongoose.Types.ObjectId;
  user_id?: mongoose.Types.ObjectId;
  respondent_email?: string;
  response_data: any;
  is_anonymous: boolean;
  ip_address?: string;
  submitted_at: Date;
  completion_time?: number; // Time in seconds to complete the survey
  started_at?: Date; // When the user started the survey
  
  // Advanced analytics fields
  device_info?: {
    type: 'mobile' | 'desktop' | 'tablet';
    os: string;
    browser: string;
    browserVersion: string;
  };
  
  question_timings?: {
    [questionId: string]: {
      startTime: Date;
      endTime: Date;
      duration: number; // seconds
    };
  };
  
  demographics?: {
    [fieldName: string]: string;
  };
  
  custom_fields?: {
    [fieldName: string]: any;
  };
  
  // Quality classification fields
  quality_status: 'quality' | 'low_quality' | 'manually_overridden';
  quality_flags: Array<{
    flag_type: 'completion_time' | 'custom';
    flagged_at: Date;
    threshold_value?: number;
  }>;
  manual_override?: {
    overridden_by: mongoose.Types.ObjectId;
    overridden_at: Date;
    reason?: string;
  };
}

const ResponseSchema = new Schema<IResponse>({
  survey_id: {
    type: Schema.Types.ObjectId,
    ref: 'Survey',
    required: true
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  respondent_email: {
    type: String,
    lowercase: true,
    trim: true
  },
  response_data: {
    type: Schema.Types.Mixed,
    required: true
  },
  is_anonymous: {
    type: Boolean,
    default: true
  },
  ip_address: String,
  submitted_at: {
    type: Date,
    default: Date.now
  },
  completion_time: {
    type: Number, // Time in seconds
    required: false
  },
  started_at: {
    type: Date,
    required: false
  },
  device_info: {
    type: {
      type: String,
      enum: ['mobile', 'desktop', 'tablet']
    },
    os: String,
    browser: String,
    browserVersion: String
  },
  question_timings: {
    type: Schema.Types.Mixed
  },
  demographics: {
    type: Schema.Types.Mixed
  },
  custom_fields: {
    type: Schema.Types.Mixed
  },
  quality_status: {
    type: String,
    enum: ['quality', 'low_quality', 'manually_overridden'],
    default: 'quality'
  },
  quality_flags: [{
    flag_type: {
      type: String,
      enum: ['completion_time', 'custom'],
      required: true
    },
    flagged_at: {
      type: Date,
      default: Date.now
    },
    threshold_value: Number
  }],
  manual_override: {
    overridden_by: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    overridden_at: Date,
    reason: String
  }
});

// Indexes for better performance
ResponseSchema.index({ survey_id: 1 });
ResponseSchema.index({ respondent_email: 1 });
ResponseSchema.index({ submitted_at: -1 });
ResponseSchema.index({ is_anonymous: 1 });
// New indexes for analytics queries
ResponseSchema.index({ survey_id: 1, submitted_at: -1 });
ResponseSchema.index({ 'device_info.type': 1 });
// Quality classification indexes
ResponseSchema.index({ survey_id: 1, quality_status: 1 });
ResponseSchema.index({ survey_id: 1, completion_time: 1 });

export const Response = mongoose.model<IResponse>('Response', ResponseSchema);