import mongoose, { Document, Schema } from 'mongoose';

export interface IAnalyticsCache extends Document {
  survey_id: mongoose.Types.ObjectId;
  cache_key: string;
  data: any;
  computed_at: Date;
  expires_at: Date;
}

const AnalyticsCacheSchema = new Schema<IAnalyticsCache>({
  survey_id: {
    type: Schema.Types.ObjectId,
    ref: 'Survey',
    required: true
  },
  cache_key: {
    type: String,
    required: true
  },
  data: {
    type: Schema.Types.Mixed,
    required: true
  },
  computed_at: {
    type: Date,
    default: Date.now
  },
  expires_at: {
    type: Date,
    required: true
  }
});

// Indexes for efficient cache lookups
AnalyticsCacheSchema.index({ survey_id: 1, cache_key: 1 }, { unique: true });
AnalyticsCacheSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 }); // TTL index

export const AnalyticsCache = mongoose.model<IAnalyticsCache>('AnalyticsCache', AnalyticsCacheSchema);
