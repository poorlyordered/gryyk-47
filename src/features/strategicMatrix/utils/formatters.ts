/**
 * Utility functions for formatting and styling in the Strategic Matrix feature
 */

/**
 * Returns the appropriate color scheme for a given category
 */
export const getCategoryColor = (category: string): string => {
  const categories: Record<string, string> = {
    'Corporation Context': 'blue',
    'Active Context': 'green',
    'Asset Information': 'purple',
    'Diplomatic Relations': 'red',
    'Operational Details': 'orange',
    'Threat Analysis': 'pink',
    'Opportunity Assessment': 'teal',
  };
  
  return categories[category] || 'gray';
};

/**
 * Formats a date for display in a standard format
 */
export const formatDate = (date: Date, format: 'short' | 'medium' | 'long' = 'medium'): string => {
  const dateObj = new Date(date);
  
  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    case 'medium':
      return dateObj.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    case 'long':
      return dateObj.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    default:
      return dateObj.toLocaleDateString();
  }
};
