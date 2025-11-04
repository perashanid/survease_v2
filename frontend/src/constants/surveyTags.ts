/**
 * Predefined survey tags for easy categorization
 * These tags help users discover relevant surveys
 */

export const SUGGESTED_SURVEY_TAGS = [
  'student research',
  'research',
  'business survey',
  'social survey',
  'academic',
  'market research',
  'customer feedback',
  'employee satisfaction',
  'product research',
  'user experience',
  'health survey',
  'education',
  'psychology',
  'sociology',
  'economics',
  'political science',
  'environmental',
  'technology',
  'lifestyle',
  'opinion poll'
] as const;

export type SurveyTag = typeof SUGGESTED_SURVEY_TAGS[number];

/**
 * Tag categories for better organization
 */
export const TAG_CATEGORIES = {
  academic: ['student research', 'research', 'academic', 'education'],
  business: ['business survey', 'market research', 'customer feedback', 'employee satisfaction'],
  research: ['product research', 'user experience', 'psychology', 'sociology'],
  general: ['social survey', 'opinion poll', 'lifestyle']
} as const;

/**
 * Get tag color based on category
 */
export function getTagColor(tag: string): string {
  if (TAG_CATEGORIES.academic.includes(tag as any)) {
    return '#667eea'; // Purple
  }
  if (TAG_CATEGORIES.business.includes(tag as any)) {
    return '#10b981'; // Green
  }
  if (TAG_CATEGORIES.research.includes(tag as any)) {
    return '#f59e0b'; // Orange
  }
  return '#6366f1'; // Default blue
}

/**
 * Get tag icon based on category
 */
export function getTagIcon(tag: string): string {
  if (TAG_CATEGORIES.academic.includes(tag as any)) {
    return '🎓';
  }
  if (TAG_CATEGORIES.business.includes(tag as any)) {
    return '💼';
  }
  if (TAG_CATEGORIES.research.includes(tag as any)) {
    return '🔬';
  }
  return '📋';
}
