import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  user_id: mongoose.Types.ObjectId;
  type: 'new_survey' | 'survey_contribution' | 'survey_response' | 'system' | 'points_earned' | 'response_locked';
  title: string;
  message: string;
  related_survey_id?: mongoose.Types.ObjectId;
  related_user_id?: mongoose.Types.ObjectId;
  is_read: boolean;
  created_at: Date;
  read_at?: Date;
}

const NotificationSchema = new Schema<INotification>({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['new_survey', 'survey_contribution', 'survey_response', 'system', 'points_earned', 'response_locked']
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  related_survey_id: {
    type: Schema.Types.ObjectId,
    ref: 'Survey'
  },
  related_user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  is_read: {
    type: Boolean,
    default: false,
    index: true
  },
  read_at: Date
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

// Indexes for better performance
NotificationSchema.index({ user_id: 1, is_read: 1 });
NotificationSchema.index({ user_id: 1, created_at: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
