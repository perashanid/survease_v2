import mongoose, { Document, Schema } from 'mongoose';

export interface ISurveyContribution extends Document {
  survey_id: mongoose.Types.ObjectId;
  contributor_id: mongoose.Types.ObjectId;
  survey_owner_id: mongoose.Types.ObjectId;
  response_id: mongoose.Types.ObjectId;
  created_at: Date;
}

const SurveyContributionSchema = new Schema<ISurveyContribution>({
  survey_id: {
    type: Schema.Types.ObjectId,
    ref: 'Survey',
    required: true,
    index: true
  },
  contributor_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  survey_owner_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  response_id: {
    type: Schema.Types.ObjectId,
    ref: 'Response',
    required: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

// Compound index to prevent duplicate contributions
SurveyContributionSchema.index({ survey_id: 1, contributor_id: 1 }, { unique: true });

export const SurveyContribution = mongoose.model<ISurveyContribution>('SurveyContribution', SurveyContributionSchema);
