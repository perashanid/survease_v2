import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomLink extends Document {
  survey_id: mongoose.Types.ObjectId;
  creator_id: mongoose.Types.ObjectId;
  link_token: string;
  link_url: string;
  is_active: boolean;
  usage_count: number;
  created_at: Date;
  expires_at?: Date;
}

const CustomLinkSchema = new Schema<ICustomLink>({
  survey_id: {
    type: Schema.Types.ObjectId,
    ref: 'Survey',
    required: true
  },
  creator_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  link_token: {
    type: String,
    required: true,
    unique: true
  },
  link_url: {
    type: String,
    required: true
  },
  is_active: {
    type: Boolean,
    default: true
  },
  usage_count: {
    type: Number,
    default: 0
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  expires_at: {
    type: Date
  }
});

// Indexes
CustomLinkSchema.index({ survey_id: 1 });
// link_token index is created by unique: true
CustomLinkSchema.index({ creator_id: 1 });
CustomLinkSchema.index({ is_active: 1 });

export const CustomLink = mongoose.model<ICustomLink>('CustomLink', CustomLinkSchema);
