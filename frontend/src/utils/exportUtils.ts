/**
 * Export utilities for analytics data
 */

export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  let csvContent = headers.join(',') + '\n';
  
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      // Handle values that might contain commas
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return value;
    });
    csvContent += values.join(',') + '\n';
  });

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportChartToImage(chartId: string, _filename: string) {
  const chartElement = document.getElementById(chartId);
  if (!chartElement) {
    alert('Chart not found');
    return;
  }

  // For now, we'll use a simple approach
  // In production, you'd want to use html2canvas or similar library
  alert('Chart export feature requires html2canvas library. Please install it for full functionality.');
}

export function prepareAnalyticsForExport(data: any) {
  // Transform analytics data into exportable format
  return {
    overview: data.overview || {},
    trends: data.trends || [],
    questions: data.questions || [],
    devices: data.devices || {},
    exportedAt: new Date().toISOString()
  };
}

export function exportQuestionMetrics(questions: any[], filename: string = 'question-metrics') {
  const exportData = questions.map(q => ({
    'Question': q.questionText,
    'Type': q.questionType,
    'Completion Rate (%)': q.completionRate.toFixed(2),
    'Avg Time (seconds)': q.avgTimeSpent.toFixed(2),
    'Drop-offs': q.dropoffCount,
    'Responses': q.responseCount
  }));

  exportToCSV(exportData, filename);
}

export function exportTrendData(trends: any[], filename: string = 'response-trends') {
  const exportData = trends.map(t => ({
    'Date': t.label || t.date,
    'Response Count': t.count
  }));

  exportToCSV(exportData, filename);
}

export function exportDeviceData(deviceData: any, filename: string = 'device-analytics') {
  const devices = deviceData.devices || {};
  const browsers = deviceData.browsers || {};

  const exportData = [
    { Category: 'Device Types', ...devices },
    { Category: 'Browsers', ...browsers }
  ];

  exportToCSV(exportData, filename);
}

export function exportFunnelData(funnelData: any[], filename: string = 'funnel-analysis') {
  const exportData = funnelData.map((stage, index) => ({
    'Step': index + 1,
    'Question': stage.questionText,
    'Completion Count': stage.completionCount,
    'Completion Rate (%)': stage.completionRate.toFixed(2),
    'Drop-off Rate (%)': stage.dropoffRate.toFixed(2)
  }));

  exportToCSV(exportData, filename);
}

// Generate a simple text-based dashboard report
export function generateTextReport(analyticsData: any): string {
  const { overview, questions, devices } = analyticsData;
  
  let report = '='.repeat(60) + '\n';
  report += 'SURVEY ANALYTICS REPORT\n';
  report += '='.repeat(60) + '\n\n';
  
  report += `Generated: ${new Date().toLocaleString()}\n\n`;
  
  if (overview) {
    report += 'OVERVIEW\n';
    report += '-'.repeat(60) + '\n';
    report += `Attention Score: ${overview.attentionScore || 'N/A'}\n`;
    report += `Issues: ${overview.issueCount || 0}\n\n`;
  }
  
  if (questions && questions.length > 0) {
    report += 'QUESTION PERFORMANCE\n';
    report += '-'.repeat(60) + '\n';
    questions.forEach((q: any, i: number) => {
      report += `${i + 1}. ${q.questionText}\n`;
      report += `   Completion Rate: ${q.completionRate.toFixed(1)}%\n`;
      report += `   Avg Time: ${q.avgTimeSpent.toFixed(1)}s\n`;
      report += `   Drop-offs: ${q.dropoffCount}\n\n`;
    });
  }
  
  if (devices) {
    report += 'DEVICE BREAKDOWN\n';
    report += '-'.repeat(60) + '\n';
    if (devices.devices) {
      report += `Mobile: ${devices.devices.mobile || 0}\n`;
      report += `Desktop: ${devices.devices.desktop || 0}\n`;
      report += `Tablet: ${devices.devices.tablet || 0}\n\n`;
    }
  }
  
  report += '='.repeat(60) + '\n';
  report += 'END OF REPORT\n';
  report += '='.repeat(60) + '\n';
  
  return report;
}

export function downloadTextReport(analyticsData: any, filename: string = 'analytics-report') {
  const report = generateTextReport(analyticsData);
  const blob = new Blob([report], { type: 'text/plain;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.txt`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
