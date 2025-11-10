import mongoose, { Document, Schema } from 'mongoose';

export interface IUserPoints extends Document {
  user_id: mongoose.Types.ObjectId;
  total_points: number;
  lifetime_points: number;
  points_spent: number;
  last_updated: Date;
}

const UserPointsSchema = new Schema<IUserPoints>({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  total_points: {
    type: Number,
    required: true,
    default: 0
  },
  lifetime_points: {
    type: Number,
    required: true,
    default: 0
  },
  points_spent: {
    type: Number,
    required: true,
    default: 0
  },
  last_updated: {
    type: Date,
    default: Date.now
  }
});

// Indexes
// user_id index is created by unique: true
UserPointsSchema.index({ total_points: -1 });

export const UserPoints = mongoose.model<IUserPoints>('UserPoints', UserPointsSchema);
