export function parseUserAgent(userAgent: string): {
  type: 'mobile' | 'desktop' | 'tablet';
  os: string;
  browser: string;
  browserVersion: string;
} {
  const ua = userAgent.toLowerCase();
  
  // Detect device type
  let type: 'mobile' | 'desktop' | 'tablet' = 'desktop';
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
    type = 'tablet';
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
    type = 'mobile';
  }
  
  // Detect OS
  let os = 'Unknown';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  
  // Detect browser
  let browser = 'Unknown';
  let browserVersion = '';
  
  if (ua.includes('edg/')) {
    browser = 'Edge';
    browserVersion = userAgent.match(/Edg\/(\d+\.\d+)/)?.[1] || '';
  } else if (ua.includes('chrome/')) {
    browser = 'Chrome';
    browserVersion = userAgent.match(/Chrome\/(\d+\.\d+)/)?.[1] || '';
  } else if (ua.includes('firefox/')) {
    browser = 'Firefox';
    browserVersion = userAgent.match(/Firefox\/(\d+\.\d+)/)?.[1] || '';
  } else if (ua.includes('safari/') && !ua.includes('chrome')) {
    browser = 'Safari';
    browserVersion = userAgent.match(/Version\/(\d+\.\d+)/)?.[1] || '';
  } else if (ua.includes('opera/') || ua.includes('opr/')) {
    browser = 'Opera';
    browserVersion = userAgent.match(/(?:Opera|OPR)\/(\d+\.\d+)/)?.[1] || '';
  }
  
  return {
    type,
    os,
    browser,
    browserVersion
  };
}
