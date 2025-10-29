import React, { useState } from 'react';
import {
  exportQuestionMetrics,
  exportTrendData,
  exportDeviceData,
  exportFunnelData,
  downloadTextReport
} from '../../utils/exportUtils';
import './ExportButton.css';

interface ExportButtonProps {
  data: any;
  type: 'questions' | 'trends' | 'devices' | 'funnel' | 'full';
  filename?: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  type,
  filename
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleExport = (format: 'csv' | 'txt') => {
    try {
      switch (type) {
        case 'questions':
          exportQuestionMetrics(data, filename);
          break;
        case 'trends':
          exportTrendData(data, filename);
          break;
        case 'devices':
          exportDeviceData(data, filename);
          break;
        case 'funnel':
          exportFunnelData(data, filename);
          break;
        case 'full':
          if (format === 'txt') {
            downloadTextReport(data, filename);
          } else {
            alert('Full export in CSV format coming soon!');
          }
          break;
      }
      setShowMenu(false);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data');
    }
  };

  return (
    <div className="export-button-container">
      <button
        className="export-button"
        onClick={() => setShowMenu(!showMenu)}
      >
        📥 Export
      </button>
      
      {showMenu && (
        <>
          <div className="export-backdrop" onClick={() => setShowMenu(false)} />
          <div className="export-menu">
            <button
              className="export-menu-item"
              onClick={() => handleExport('csv')}
            >
              <span className="export-icon">📊</span>
              <div>
                <div className="export-menu-title">Export as CSV</div>
                <div className="export-menu-desc">Spreadsheet format</div>
              </div>
            </button>
            
            {type === 'full' && (
              <button
                className="export-menu-item"
                onClick={() => handleExport('txt')}
              >
                <span className="export-icon">📄</span>
                <div>
                  <div className="export-menu-title">Export as Text</div>
                  <div className="export-menu-desc">Plain text report</div>
                </div>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ExportButton;
