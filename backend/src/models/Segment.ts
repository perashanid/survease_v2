import mongoose, { Document, Schema } from 'mongoose';

export interface ISegment extends Document {
  user_id: mongoose.Types.ObjectId;
  survey_id: mongoose.Types.ObjectId;
  name: string;
  criteria: {
    dateRange?: { start: Date; end: Date };
    demographics?: Record<string, string[]>;
    customFields?: Record<string, any>;
    searchQuery?: string;
  };
  color: string;
  created_at: Date;
}

const SegmentSchema = new Schema<ISegment>({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  survey_id: {
    type: Schema.Types.ObjectId,
    ref: 'Survey',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  criteria: {
    type: Schema.Types.Mixed,
    required: true
  },
  color: {
    type: String,
    default: '#3b82f6'
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Indexes for user and survey lookups
SegmentSchema.index({ user_id: 1, survey_id: 1 });
SegmentSchema.index({ survey_id: 1 });

export const Segment = mongoose.model<ISegment>('Segment', SegmentSchema);
