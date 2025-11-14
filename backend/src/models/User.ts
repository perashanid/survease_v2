import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  email_verified: boolean;
  is_admin: boolean;
  password_reset_token?: string;
  password_reset_expires?: Date;
  oauth_provider?: string;
  oauth_id?: string;
  created_at: Date;
  updated_at: Date;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password_hash: {
    type: String,
    required: false
  },
  first_name: {
    type: String,
    trim: true
  },
  last_name: {
    type: String,
    trim: true
  },
  email_verified: {
    type: Boolean,
    default: false
  },
  is_admin: {
    type: Boolean,
    default: false
  },
  password_reset_token: {
    type: String
  },
  password_reset_expires: {
    type: Date
  },
  oauth_provider: {
    type: String,
    enum: ['google', 'facebook', 'github'],
    required: false
  },
  oauth_id: {
    type: String,
    required: false
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Note: email index is automatically created by unique: true

export const User = mongoose.model<IUser>('User', UserSchema);