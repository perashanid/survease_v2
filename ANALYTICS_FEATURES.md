# Advanced Analytics & Visualization Features

This document describes the advanced analytics and visualization features implemented for the survey platform.

## Features Implemented

### 1. Backend Infrastructure

#### Data Models
- **Enhanced Response Model**: Added fields for device tracking, question timings, demographics, and custom fields
- **AnalyticsCache Model**: Caching layer for computed analytics with TTL
- **Segment Model**: Store user-defined audience segments

#### Services
- **AnalyticsAggregationService**: Aggregates response data by time periods, generates heatmaps, calculates funnels, and question-level metrics
- **ForecastService**: Predicts future response rates using linear regression with confidence intervals
- **SegmentationService**: Filters and compares response segments based on criteria
- **AttentionScoreService**: Identifies surveys needing attention and generates recommendations

#### API Endpoints
- `/api/analytics/:surveyId/overview` - Summary metrics with sparklines
- `/api/analytics/:surveyId/trends` - Time series data for line charts
- `/api/analytics/:surveyId/heatmap` - Response time heatmap data
- `/api/analytics/:surveyId/funnel` - Completion funnel stages
- `/api/analytics/:surveyId/questions` - Question-level performance metrics
- `/api/analytics/:surveyId/devices` - Device and browser analytics
- `/api/analytics/:surveyId/forecast` - Forecasted response data
- `/api/analytics/:surveyId/compare` - Multi-survey comparison
- `/api/analytics/:surveyId/filter` - Filtered analytics data
- `/api/analytics/:surveyId/search` - Search within responses
- `/api/segments/*` - Segment CRUD operations
- `/api/attention/*` - Attention monitoring endpoints

### 2. Frontend Components

#### Chart Components
- **LineChartComponent**: Interactive line charts using Recharts
- **PieChartComponent**: Pie and donut charts for distributions
- **HeatmapComponent**: Custom heatmap visualization for response times
- **FunnelChartComponent**: Funnel visualization showing drop-off rates
- **SparklineComponent**: Micro trend indicators

#### Analytics Components
- **QuestionPerformanceTable**: Sortable table with question metrics
- **FilterPanel**: Date range, search, and demographic filters
- **AttentionPanel**: Dashboard showing surveys needing attention

#### Pages
- **EnhancedSurveyAnalytics**: Single survey analytics with tabs
- **AdvancedAnalyticsDashboard**: Comprehensive analytics dashboard

### 3. Device Tracking

- **Device Detection Utility**: Automatically detects device type, OS, browser, and version
- **Survey Response Integration**: Device info captured on survey submission
- **Analytics Visualization**: Device and browser breakdown charts

### 4. Key Features

#### Response Trends
- Time series visualization with multiple period options (hour, day, week, month)
- Trend detection (increasing, decreasing, stable)
- 7-day and 30-day forecasting with confidence intervals

#### Heatmap Analysis
- Response times by day of week and hour of day
- Color-coded intensity showing response volume
- Interactive tooltips with exact counts

#### Funnel Visualization
- Progressive drop-off rates at each question
- Highlights questions with >20% drop-off
- Completion counts and percentages

#### Question Analytics
- Completion rate per question
- Average time spent per question
- Drop-off counts
- Sortable performance table
- Flags problematic questions (>2min avg time or <50% completion)

#### Device Analytics
- Mobile vs Desktop vs Tablet breakdown
- Browser distribution
- Pie chart visualizations

#### Segmentation
- Filter responses by date range, demographics, custom fields
- Text search across responses
- Save and compare up to 5 segments
- Segment-specific metrics

#### Attention Monitoring
- Automatic attention score calculation (0-100)
- Issue identification:
  - Low completion rate (<50%)
  - No responses in last 7 days
  - High drop-off rates (>30%)
  - Slow response rates
- Actionable recommendations for each issue
- Dashboard showing all surveys needing attention

#### Forecasting
- Linear regression-based predictions
- 7-day and 30-day forecasts
- Confidence intervals (95%)
- Visual distinction from historical data

### 5. Performance Optimizations

- **Caching**: 5-minute cache for analytics queries
- **Database Indexes**: Compound indexes on survey_id + submitted_at
- **Aggregation Pipelines**: MongoDB aggregation for heavy computations
- **Lazy Loading**: Chart components loaded on demand

## Usage

### Viewing Analytics

1. Navigate to a survey's analytics page
2. Use the filter panel to narrow down data by date range or search terms
3. Switch between tabs to view different visualizations:
   - **Overview**: Trends, forecasts, and key metrics
   - **Questions**: Detailed question performance
   - **Funnel**: Completion funnel analysis
   - **Heatmap**: Response time patterns
   - **Devices**: Device and browser breakdown
   - **Attention**: Surveys needing attention

### Creating Segments

1. Go to the analytics page
2. Apply filters to define your segment
3. Save the segment for future comparison
4. Compare up to 5 segments side-by-side

### Monitoring Survey Health

1. Check the Attention tab in analytics
2. Review attention scores and issues
3. Follow the recommendations to improve performance

## Technical Stack

- **Backend**: Node.js, Express, TypeScript, MongoDB
- **Frontend**: React, TypeScript, Recharts
- **Charting**: Recharts 2.x
- **Date Handling**: date-fns
- **State Management**: React hooks and context

## Database Schema Changes

### Response Collection
```javascript
{
  // ... existing fields ...
  device_info: {
    type: String, // 'mobile' | 'desktop' | 'tablet'
    os: String,
    browser: String,
    browserVersion: String
  },
  question_timings: {
    [questionId]: {
      startTime: Date,
      endTime: Date,
      duration: Number
    }
  },
  demographics: Object,
  custom_fields: Object
}
```

### New Collections
- **analyticscaches**: Cached analytics results with TTL
- **segments**: User-defined audience segments

## API Response Examples

### Trends Endpoint
```json
{
  "data": [
    { "date": "2024-01-01", "count": 45, "label": "2024-01-01" },
    { "date": "2024-01-02", "count": 52, "label": "2024-01-02" }
  ],
  "trend": "increasing"
}
```

### Attention Endpoint
```json
{
  "surveyId": "123",
  "title": "Customer Satisfaction Survey",
  "attentionScore": 65,
  "issues": [
    {
      "type": "low_completion",
      "severity": "high",
      "message": "Survey has a low completion rate of 42.3%"
    }
  ],
  "recommendations": [
    "Consider shortening the survey or making questions optional",
    "Review question clarity and simplify complex questions"
  ]
}
```

## Future Enhancements

- Real-time analytics updates via WebSocket
- Export analytics to PDF/CSV
- Custom dashboard layouts
- Advanced segmentation with AND/OR logic
- A/B testing support
- Response quality scoring
- Sentiment analysis for text responses
- Cohort analysis
- Retention metrics
