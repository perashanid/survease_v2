import mongoose, { Document, Schema } from 'mongoose';

export interface IInvitationToken extends Document {
  survey_id: mongoose.Types.ObjectId;
  token: string;
  created_by: mongoose.Types.ObjectId;
  created_at: Date;
  expires_at?: Date;
  is_active: boolean;
  usage_count: number;
  max_uses?: number;
  description?: string;
}

const InvitationTokenSchema = new Schema<IInvitationToken>({
  survey_id: {
    type: Schema.Types.ObjectId,
    ref: 'Survey',
    required: true,
    index: true
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  created_by: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  expires_at: {
    type: Date,
    default: null
  },
  is_active: {
    type: Boolean,
    default: true
  },
  usage_count: {
    type: Number,
    default: 0
  },
  max_uses: {
    type: Number,
    default: null
  },
  description: {
    type: String,
    maxlength: 200
  }
});

// Index for efficient queries
InvitationTokenSchema.index({ survey_id: 1, is_active: 1 });
InvitationTokenSchema.index({ token: 1, is_active: 1 });

export const InvitationToken = mongoose.model<IInvitationToken>('InvitationToken', InvitationTokenSchema);