import mongoose, { Document, Schema } from 'mongoose';

export interface IPointsTransaction extends Document {
  user_id: mongoose.Types.ObjectId;
  transaction_type: 'earned' | 'spent' | 'bonus';
  points: number;
  source: 'survey_completion' | 'response_unlock' | 'boost_bonus' | 'survey_creation' | 'boost_survey' | 'unlock_response';
  related_survey_id?: mongoose.Types.ObjectId;
  related_response_id?: mongoose.Types.ObjectId;
  description: string;
  created_at: Date;
}

const PointsTransactionSchema = new Schema<IPointsTransaction>({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  transaction_type: {
    type: String,
    enum: ['earned', 'spent', 'bonus'],
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  source: {
    type: String,
    enum: ['survey_completion', 'response_unlock', 'boost_bonus', 'survey_creation', 'boost_survey', 'unlock_response'],
    required: true
  },
  related_survey_id: {
    type: Schema.Types.ObjectId,
    ref: 'Survey'
  },
  related_response_id: {
    type: Schema.Types.ObjectId,
    ref: 'Response'
  },
  description: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Indexes
PointsTransactionSchema.index({ user_id: 1, created_at: -1 });
PointsTransactionSchema.index({ related_survey_id: 1 });
PointsTransactionSchema.index({ created_at: -1 });

export const PointsTransaction = mongoose.model<IPointsTransaction>('PointsTransaction', PointsTransactionSchema);
