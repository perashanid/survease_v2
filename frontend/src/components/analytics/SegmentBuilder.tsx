import React, { useState, useEffect } from 'react';
import analyticsService, { SegmentDefinition, FilterCriteria } from '../../services/analyticsService';
import './SegmentBuilder.css';

interface SegmentBuilderProps {
  surveyId: string;
  onSegmentCreate?: (segment: SegmentDefinition) => void;
}

const SegmentBuilder: React.FC<SegmentBuilderProps> = ({
  surveyId,
  onSegmentCreate
}) => {
  const [segments, setSegments] = useState<SegmentDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [criteria, setCriteria] = useState<FilterCriteria>({});

  useEffect(() => {
    fetchSegments();
  }, [surveyId]);

  const fetchSegments = async () => {
    try {
      const data = await analyticsService.getSegments(surveyId);
      setSegments(data.segments || []);
    } catch (error) {
      console.error('Error fetching segments:', error);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      alert('Please enter a segment name');
      return;
    }

    try {
      setLoading(true);
      const newSegment: SegmentDefinition = {
        name,
        criteria,
        color
      };

      await analyticsService.createSegment(surveyId, newSegment);
      
      // Reset form
      setName('');
      setColor('#3b82f6');
      setCriteria({});
      
      // Refresh segments
      await fetchSegments();
      
      if (onSegmentCreate) {
        onSegmentCreate(newSegment);
      }
    } catch (error) {
      console.error('Error creating segment:', error);
      alert('Failed to create segment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (segmentId: string) => {
    if (!confirm('Are you sure you want to delete this segment?')) {
      return;
    }

    try {
      await analyticsService.deleteSegment(segmentId);
      await fetchSegments();
    } catch (error) {
      console.error('Error deleting segment:', error);
      alert('Failed to delete segment');
    }
  };

  const handleDateChange = (field: 'start' | 'end', value: string) => {
    const newDateRange = {
      start: criteria.dateRange?.start || new Date(),
      end: criteria.dateRange?.end || new Date(),
      [field]: new Date(value)
    };
    setCriteria({ ...criteria, dateRange: newDateRange });
  };

  return (
    <div className="segment-builder">
      <div className="segment-builder-header">
        <h3 className="segment-builder-title">Segment Builder</h3>
      </div>

      <div className="segment-form">
        <div className="segment-field">
          <label className="segment-label">Segment Name</label>
          <input
            type="text"
            className="segment-input"
            placeholder="e.g., Mobile Users, Recent Responses"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="segment-field">
          <label className="segment-label">Color</label>
          <div className="color-picker-container">
            <input
              type="color"
              className="color-picker"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
            <div className="color-preview" style={{ background: color }} />
            <span style={{ fontSize: '13px', color: '#6b7280' }}>{color}</span>
          </div>
        </div>

        <div className="segment-field">
          <label className="segment-label">Date Range (Optional)</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <input
              type="date"
              className="segment-input"
              value={criteria.dateRange?.start.toISOString().split('T')[0] || ''}
              onChange={(e) => handleDateChange('start', e.target.value)}
            />
            <input
              type="date"
              className="segment-input"
              value={criteria.dateRange?.end.toISOString().split('T')[0] || ''}
              onChange={(e) => handleDateChange('end', e.target.value)}
            />
          </div>
        </div>

        <div className="segment-field">
          <label className="segment-label">Search Query (Optional)</label>
          <input
            type="text"
            className="segment-input"
            placeholder="Search in responses..."
            value={criteria.searchQuery || ''}
            onChange={(e) => setCriteria({ ...criteria, searchQuery: e.target.value })}
          />
        </div>

        <div className="segment-actions">
          <button
            className="segment-btn segment-btn-primary"
            onClick={handleCreate}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Segment'}
          </button>
          <button
            className="segment-btn segment-btn-secondary"
            onClick={() => {
              setName('');
              setColor('#3b82f6');
              setCriteria({});
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {segments.length > 0 && (
        <div className="saved-segments">
          <h4 className="saved-segments-title">Saved Segments ({segments.length})</h4>
          <div className="segment-list">
            {segments.map((segment) => (
              <div key={segment.id} className="segment-item">
                <div className="segment-item-info">
                  <div
                    className="segment-color-badge"
                    style={{ background: segment.color }}
                  />
                  <span className="segment-item-name">{segment.name}</span>
                </div>
                <div className="segment-item-actions">
                  <button
                    className="segment-icon-btn delete"
                    onClick={() => handleDelete(segment.id!)}
                    title="Delete segment"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {segments.length === 0 && (
        <div className="segment-empty">
          <p>No segments created yet. Create your first segment above!</p>
        </div>
      )}
    </div>
  );
};

export default SegmentBuilder;
