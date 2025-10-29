/**
 * Accessibility utilities for analytics components
 */

export function announceToScreenReader(message: string) {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

export function addKeyboardNavigation(element: HTMLElement, onActivate: () => void) {
  element.setAttribute('tabindex', '0');
  element.setAttribute('role', 'button');
  
  element.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onActivate();
    }
  });
}

export function generateChartDescription(chartType: string, data: any[]): string {
  switch (chartType) {
    case 'line':
      return `Line chart showing ${data.length} data points. Values range from ${Math.min(...data.map(d => d.value))} to ${Math.max(...data.map(d => d.value))}.`;
    
    case 'pie':
      const total = data.reduce((sum, d) => sum + d.value, 0);
      return `Pie chart with ${data.length} segments. Total value: ${total}. Largest segment: ${data[0]?.name} at ${((data[0]?.value / total) * 100).toFixed(1)}%.`;
    
    case 'bar':
      return `Bar chart with ${data.length} bars. Highest value: ${Math.max(...data.map(d => d.value))}. Lowest value: ${Math.min(...data.map(d => d.value))}.`;
    
    case 'heatmap':
      return `Heatmap showing response patterns across ${data.length} time periods.`;
    
    default:
      return `Chart displaying ${data.length} data points.`;
  }
}

export function getColorContrastRatio(color1: string, color2: string): number {
  // Simplified contrast ratio calculation
  // In production, use a proper color contrast library
  const getLuminance = (color: string) => {
    const rgb = parseInt(color.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

export function ensureAccessibleColor(color: string, background: string = '#ffffff'): string {
  const ratio = getColorContrastRatio(color, background);
  
  // WCAG AA requires 4.5:1 for normal text
  if (ratio < 4.5) {
    // Return a darker version if contrast is too low
    return '#1f2937'; // Default dark color
  }
  
  return color;
}

export function addAriaLabels(element: HTMLElement, label: string, description?: string) {
  element.setAttribute('aria-label', label);
  if (description) {
    element.setAttribute('aria-describedby', description);
  }
}

export function createDataTable(chartData: any[], headers: string[]): string {
  let table = '<table class="sr-only"><thead><tr>';
  
  headers.forEach(header => {
    table += `<th>${header}</th>`;
  });
  
  table += '</tr></thead><tbody>';
  
  chartData.forEach(row => {
    table += '<tr>';
    headers.forEach(header => {
      table += `<td>${row[header.toLowerCase()] || ''}</td>`;
    });
    table += '</tr>';
  });
  
  table += '</tbody></table>';
  
  return table;
}

export function setupFocusTrap(container: HTMLElement) {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
  
  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };
  
  container.addEventListener('keydown', handleTabKey);
  
  return () => {
    container.removeEventListener('keydown', handleTabKey);
  };
}

export function addSkipLink(targetId: string, label: string) {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.className = 'skip-link';
  skipLink.textContent = label;
  
  skipLink.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
  
  return skipLink;
}
