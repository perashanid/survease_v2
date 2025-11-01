import mongoose, { Document, Schema } from 'mongoose';

export interface IPattern {
  type: 'correlation' | 'temporal' | 'demographic' | 'anomaly';
  description: string;
  confidence: number; // 0-100
  supporting_data: any;
  statistical_significance: number;
}

export interface IRecommendation {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  reasoning: string;
  suggested_actions: string[];
}

export interface IQuestionInsight {
  question_id: string;
  question_text: string;
  insight: string;
  response_distribution: any;
}

export interface IResponseStatistics {
  total_responses: number;
  completion_rate: number;
  average_completion_time: number;
  quality_responses: number;
  low_quality_responses: number;
}

export interface ISummary {
  overview: string;
  key_findings: string[];
  response_statistics: IResponseStatistics;
  question_insights: IQuestionInsight[];
}

export interface IDataSnapshot {
  response_count: number;
  date_range: {
    start: Date;
    end: Date;
  };
  filters_applied: any;
}

export interface IAIInsight extends Document {
  survey_id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  
  // Summary data
  summary: ISummary;
  
  // Pattern detection
  patterns: IPattern[];
  
  // Recommendations
  recommendations: IRecommendation[];
  
  // Metadata
  generated_at: Date;
  data_snapshot: IDataSnapshot;
  
  // Cache control
  is_stale: boolean;
  expires_at: Date;
}

const AIInsightSchema = new Schema<IAIInsight>({
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
  summary: {
    overview: {
      type: String,
      required: true
    },
    key_findings: [{
      type: String
    }],
    response_statistics: {
      total_responses: {
        type: Number,
        required: true
      },
      completion_rate: {
        type: Number,
        required: true
      },
      average_completion_time: {
        type: Number,
        required: true
      },
      quality_responses: {
        type: Number,
        required: true
      },
      low_quality_responses: {
        type: Number,
        required: true
      }
    },
    question_insights: [{
      question_id: {
        type: String,
        required: true
      },
      question_text: {
        type: String,
        required: true
      },
      insight: {
        type: String,
        required: true
      },
      response_distribution: Schema.Types.Mixed
    }]
  },
  patterns: [{
    type: {
      type: String,
      enum: ['correlation', 'temporal', 'demographic', 'anomaly'],
      required: true
    },
    description: {
      type: String,
      required: true
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    supporting_data: Schema.Types.Mixed,
    statistical_significance: {
      type: Number,
      required: true
    }
  }],
  recommendations: [{
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      required: true
    },
    reasoning: {
      type: String,
      required: true
    },
    suggested_actions: [{
      type: String
    }]
  }],
  generated_at: {
    type: Date,
    default: Date.now
  },
  data_snapshot: {
    response_count: {
      type: Number,
      required: true
    },
    date_range: {
      start: {
        type: Date,
        required: true
      },
      end: {
        type: Date,
        required: true
      }
    },
    filters_applied: Schema.Types.Mixed
  },
  is_stale: {
    type: Boolean,
    default: false
  },
  expires_at: {
    type: Date,
    required: true
  }
});

// Indexes for better performance
AIInsightSchema.index({ survey_id: 1, generated_at: -1 });
AIInsightSchema.index({ user_id: 1, generated_at: -1 });
AIInsightSchema.index({ expires_at: 1 });
AIInsightSchema.index({ survey_id: 1, is_stale: 1 });

export const AIInsight = mongoose.model<IAIInsight>('AIInsight', AIInsightSchema);
