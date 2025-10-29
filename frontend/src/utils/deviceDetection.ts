export interface DeviceInfo {
  type: 'mobile' | 'desktop' | 'tablet';
  os: string;
  browser: string;
  browserVersion: string;
}

export function detectDevice(): DeviceInfo {
  const userAgent = navigator.userAgent;
  
  // Detect device type
  const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent);
  
  let type: 'mobile' | 'desktop' | 'tablet' = 'desktop';
  if (isTablet) {
    type = 'tablet';
  } else if (isMobile) {
    type = 'mobile';
  }

  // Detect OS
  let os = 'Unknown';
  if (/Windows/i.test(userAgent)) os = 'Windows';
  else if (/Mac OS X/i.test(userAgent)) os = 'macOS';
  else if (/Linux/i.test(userAgent)) os = 'Linux';
  else if (/Android/i.test(userAgent)) os = 'Android';
  else if (/iOS|iPhone|iPad|iPod/i.test(userAgent)) os = 'iOS';

  // Detect browser
  let browser = 'Unknown';
  let browserVersion = '';

  if (/Edg\//i.test(userAgent)) {
    browser = 'Edge';
    const match = userAgent.match(/Edg\/(\d+)/);
    browserVersion = match ? match[1] : '';
  } else if (/Chrome/i.test(userAgent) && !/Edg/i.test(userAgent)) {
    browser = 'Chrome';
    const match = userAgent.match(/Chrome\/(\d+)/);
    browserVersion = match ? match[1] : '';
  } else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) {
    browser = 'Safari';
    const match = userAgent.match(/Version\/(\d+)/);
    browserVersion = match ? match[1] : '';
  } else if (/Firefox/i.test(userAgent)) {
    browser = 'Firefox';
    const match = userAgent.match(/Firefox\/(\d+)/);
    browserVersion = match ? match[1] : '';
  }

  return {
    type,
    os,
    browser,
    browserVersion
  };
}
