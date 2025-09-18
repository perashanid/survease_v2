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
  }
});

// Indexes for better performance
ResponseSchema.index({ survey_id: 1 });
ResponseSchema.index({ respondent_email: 1 });
ResponseSchema.index({ submitted_at: -1 });
ResponseSchema.index({ is_anonymous: 1 });

export const Response = mongoose.model<IResponse>('Response', ResponseSchema);