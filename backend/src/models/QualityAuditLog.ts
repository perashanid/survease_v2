import mongoose, { Document, Schema } from 'mongoose';

export interface IQualityAuditLog extends Document {
  response_id: mongoose.Types.ObjectId;
  survey_id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  
  action: 'flagged' | 'overridden' | 'restored';
  previous_status: 'quality' | 'low_quality';
  new_status: 'quality' | 'low_quality';
  
  reason?: string;
  completion_time: number;
  threshold_at_time: number;
  
  timestamp: Date;
}

const QualityAuditLogSchema = new Schema<IQualityAuditLog>({
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
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    enum: ['flagged', 'overridden', 'restored'],
    required: true
  },
  previous_status: {
    type: String,
    enum: ['quality', 'low_quality'],
    required: true
  },
  new_status: {
    type: String,
    enum: ['quality', 'low_quality'],
    required: true
  },
  reason: {
    type: String
  },
  completion_time: {
    type: Number,
    required: true
  },
  threshold_at_time: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better performance
QualityAuditLogSchema.index({ response_id: 1 });
QualityAuditLogSchema.index({ survey_id: 1, timestamp: -1 });
QualityAuditLogSchema.index({ user_id: 1, timestamp: -1 });

export const QualityAuditLog = mongoose.model<IQualityAuditLog>('QualityAuditLog', QualityAuditLogSchema);
