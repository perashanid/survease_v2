import mongoose, { Document, Schema } from 'mongoose';

export interface IResponseUnlock extends Document {
  response_id: mongoose.Types.ObjectId;
  survey_id: mongoose.Types.ObjectId;
  survey_owner_id: mongoose.Types.ObjectId;
  unlocked_by_survey_id: mongoose.Types.ObjectId;
  unlocked_by_survey_owner_id: mongoose.Types.ObjectId;
  unlocked_at: Date;
  points_awarded: number;
}

const ResponseUnlockSchema = new Schema<IResponseUnlock>({
  response_id: {
    type: Schema.Types.ObjectId,
    ref: 'Response',
    required: true
  },
  survey_id: {
    type: Schema.Types.ObjectId,
    ref: 'Survey',
    required: true
  },
  survey_owner_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  unlocked_by_survey_id: {
    type: Schema.Types.ObjectId,
    ref: 'Survey',
    required: true
  },
  unlocked_by_survey_owner_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  unlocked_at: {
    type: Date,
    default: Date.now
  },
  points_awarded: {
    type: Number,
    required: true,
    default: 0
  }
});

// Indexes
ResponseUnlockSchema.index({ response_id: 1 });
ResponseUnlockSchema.index({ survey_id: 1 });
ResponseUnlockSchema.index({ survey_owner_id: 1 });
ResponseUnlockSchema.index({ unlocked_by_survey_owner_id: 1 });
ResponseUnlockSchema.index({ unlocked_at: -1 });

export const ResponseUnlock = mongoose.model<IResponseUnlock>('ResponseUnlock', ResponseUnlockSchema);
