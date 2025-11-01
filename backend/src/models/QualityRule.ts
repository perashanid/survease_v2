import mongoose, { Document, Schema } from 'mongoose';

export interface IQualityRule extends Document {
  survey_id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  
  // Time-based rules
  min_completion_time: number; // seconds
  
  // Future extensibility
  custom_rules?: Array<{
    rule_type: string;
    parameters: any;
  }>;
  
  // Statistics
  total_flagged: number;
  total_overridden: number;
  
  created_at: Date;
  updated_at: Date;
}

const QualityRuleSchema = new Schema<IQualityRule>({
  survey_id: {
    type: Schema.Types.ObjectId,
    ref: 'Survey',
    required: true,
    unique: true
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  min_completion_time: {
    type: Number,
    required: true,
    min: 5,
    max: 3600,
    default: 30
  },
  custom_rules: [{
    rule_type: {
      type: String
    },
    parameters: Schema.Types.Mixed
  }],
  total_flagged: {
    type: Number,
    default: 0
  },
  total_overridden: {
    type: Number,
    default: 0
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better performance
QualityRuleSchema.index({ survey_id: 1 });
QualityRuleSchema.index({ user_id: 1 });

// Update the updated_at timestamp before saving
QualityRuleSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

export const QualityRule = mongoose.model<IQualityRule>('QualityRule', QualityRuleSchema);
import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomRule {
  rule_type: string;
  parameters: any;
}

export interface IQualityRule extends Document {
  survey_id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  
  // Time-based rules
  min_completion_time: number; // seconds
  
  // Future extensibility
  custom_rules?: ICustomRule[];
  
  // Statistics
  total_flagged: number;
  total_overridden: number;
  
  created_at: Date;
  updated_at: Date;
}

const QualityRuleSchema = new Schema<IQualityRule>({
  survey_id: {
    type: Schema.Types.ObjectId,
    ref: 'Survey',
    required: true,
    unique: true
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  min_completion_time: {
    type: Number,
    required: true,
    min: 5,
    max: 3600,
    default: 30
  },
  custom_rules: [{
    rule_type: {
      type: String,
      required: true
    },
    parameters: Schema.Types.Mixed
  }],
  total_flagged: {
    type: Number,
    default: 0
  },
  total_overridden: {
    type: Number,
    default: 0
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes for better performance
QualityRuleSchema.index({ survey_id: 1 });
QualityRuleSchema.index({ user_id: 1 });

export const QualityRule = mongoose.model<IQualityRule>('QualityRule', QualityRuleSchema);
