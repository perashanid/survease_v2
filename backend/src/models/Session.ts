import mongoose, { Document, Schema } from 'mongoose';

export interface ISession extends Document {
  user_id: mongoose.Types.ObjectId;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
}

const SessionSchema = new Schema<ISession>({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token_hash: {
    type: String,
    required: true
  },
  expires_at: {
    type: Date,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better performance
SessionSchema.index({ user_id: 1 });
SessionSchema.index({ token_hash: 1 });
SessionSchema.index({ expires_at: 1 });

export const Session = mongoose.model<ISession>('Session', SessionSchema);