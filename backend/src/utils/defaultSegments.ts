import { ISegment } from '../models/Segment';

export interface DefaultSegmentTemplate {
  name: string;
  criteria: {
    dateRange?: { start: Date; end: Date };
    demographics?: Record<string, string[]>;
    customFields?: Record<string, any>;
    searchQuery?: string;
  };
  color: string;
  description: string;
}

/**
 * Generate default segment templates for a survey
 * These segments provide common filtering patterns that users can use immediately
 */
export function getDefaultSegmentTemplates(): DefaultSegmentTemplate[] {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  return [
    {
      name: 'All Responses',
      criteria: {},
      color: '#3b82f6', // Blue
      description: 'All survey responses without any filters'
    },
    {
      name: 'Last 7 Days',
      criteria: {
        dateRange: {
          start: sevenDaysAgo,
          end: now
        }
      },
      color: '#10b981', // Green
      description: 'Responses submitted in the last 7 days'
    },
    {
      name: 'Last 30 Days',
      criteria: {
        dateRange: {
          start: thirtyDaysAgo,
          end: now
        }
      },
      color: '#f59e0b', // Amber
      description: 'Responses submitted in the last 30 days'
    },
    {
      name: 'Last 90 Days',
      criteria: {
        dateRange: {
          start: ninetyDaysAgo,
          end: now
        }
      },
      color: '#8b5cf6', // Purple
      description: 'Responses submitted in the last 90 days'
    },
    {
      name: 'Recent Activity',
      criteria: {
        dateRange: {
          start: sevenDaysAgo,
          end: now
        }
      },
      color: '#ec4899', // Pink
      description: 'Recent responses for quick analysis'
    }
  ];
}

/**
 * Check if default segments exist for a survey
 */
export function isDefaultSegment(segmentName: string): boolean {
  const defaultNames = [
    'All Responses',
    'Last 7 Days',
    'Last 30 Days',
    'Last 90 Days',
    'Recent Activity'
  ];
  return defaultNames.includes(segmentName);
}
