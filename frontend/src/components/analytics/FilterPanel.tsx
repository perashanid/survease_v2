import React from 'react';
import './FilterPanel.css';

export interface FilterCriteria {
  dateRange?: { start: Date; end: Date };
  demographics?: Record<string, string[]>;
  customFields?: Record<string, any>;
  searchQuery?: string;
}

interface FilterPanelProps {
  filters: FilterCriteria;
  onFilterChange: (filters: FilterCriteria) => void;
  onReset: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
  onReset
}) => {
  const handleDateChange = (field: 'start' | 'end', value: string) => {
    const newDateRange = {
      start: filters.dateRange?.start || new Date(),
      end: filters.dateRange?.end || new Date(),
      [field]: new Date(value)
    };
    onFilterChange({ ...filters, dateRange: newDateRange });
  };

  const handleSearchChange = (value: string) => {
    onFilterChange({ ...filters, searchQuery: value });
  };

  const hasActiveFilters = (): boolean => {
    return !!(
      filters.dateRange ||
      filters.searchQuery ||
      (filters.demographics && Object.keys(filters.demographics).length > 0) ||
      (filters.customFields && Object.keys(filters.customFields).length > 0)
    );
  };

  const getActiveFilterBadges = (): string[] => {
    const badges: string[] = [];
    
    if (filters.dateRange) {
      badges.push(`Date: ${filters.dateRange.start.toLocaleDateString()} - ${filters.dateRange.end.toLocaleDateString()}`);
    }
    
    if (filters.searchQuery) {
      badges.push(`Search: "${filters.searchQuery}"`);
    }
    
    return badges;
  };

  return (
    <div className="filter-panel">
      <div className="filter-panel-header">
        <h3 className="filter-panel-title">Filters</h3>
        {hasActiveFilters() && (
          <button className="filter-reset-btn" onClick={onReset}>
            Reset All
          </button>
        )}
      </div>

      <div className="filter-grid">
        <div className="filter-field">
          <label className="filter-label">Start Date</label>
          <input
            type="date"
            className="filter-input"
            value={filters.dateRange?.start.toISOString().split('T')[0] || ''}
            onChange={(e) => handleDateChange('start', e.target.value)}
          />
        </div>

        <div className="filter-field">
          <label className="filter-label">End Date</label>
          <input
            type="date"
            className="filter-input"
            value={filters.dateRange?.end.toISOString().split('T')[0] || ''}
            onChange={(e) => handleDateChange('end', e.target.value)}
          />
        </div>

        <div className="filter-field">
          <label className="filter-label">Search Responses</label>
          <input
            type="text"
            className="filter-input"
            placeholder="Search in responses..."
            value={filters.searchQuery || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      {hasActiveFilters() && (
        <div className="filter-badges">
          {getActiveFilterBadges().map((badge, index) => (
            <span key={index} className="filter-badge">
              {badge}
              <button
                className="filter-badge-remove"
                onClick={onReset}
                aria-label="Remove filter"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
