import mongoose, { Document, Schema } from 'mongoose';

export interface IUserProfile extends Document {
  user_id: mongoose.Types.ObjectId;
  bio?: string;
  avatar_url?: string;
  institution?: string;
  field_of_study?: string;
  interests: string[];
  surveys_created: number;
  surveys_completed: number;
  contributions_made: number;
  contributions_received: number;
  created_at: Date;
  updated_at: Date;
}

const UserProfileSchema = new Schema<IUserProfile>({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  bio: {
    type: String,
    maxlength: 500
  },
  avatar_url: {
    type: String
  },
  institution: {
    type: String,
    trim: true
  },
  field_of_study: {
    type: String,
    trim: true
  },
  interests: [{
    type: String,
    trim: true
  }],
  surveys_created: {
    type: Number,
    default: 0
  },
  surveys_completed: {
    type: Number,
    default: 0
  },
  contributions_made: {
    type: Number,
    default: 0
  },
  contributions_received: {
    type: Number,
    default: 0
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export const UserProfile = mongoose.model<IUserProfile>('UserProfile', UserProfileSchema);
