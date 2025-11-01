export interface DeviceInfo {
  type: 'mobile' | 'desktop' | 'tablet';
  os: string;
  browser: string;
  browserVersion: string;
}

export function parseUserAgent(userAgent: string): DeviceInfo {
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
  if (ua.includes('windows nt 10.0')) os = 'Windows 10';
  else if (ua.includes('windows nt 6.3')) os = 'Windows 8.1';
  else if (ua.includes('windows nt 6.2')) os = 'Windows 8';
  else if (ua.includes('windows nt 6.1')) os = 'Windows 7';
  else if (ua.includes('windows nt 6.0')) os = 'Windows Vista';
  else if (ua.includes('windows nt 5.1')) os = 'Windows XP';
  else if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac os x')) {
    const match = ua.match(/mac os x ([\d_]+)/);
    os = match ? `macOS ${match[1].replace(/_/g, '.')}` : 'macOS';
  }
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('iphone')) os = 'iOS';
  else if (ua.includes('ipad')) os = 'iPadOS';
  else if (ua.includes('android')) {
    const match = ua.match(/android ([\d.]+)/);
    os = match ? `Android ${match[1]}` : 'Android';
  }
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('ubuntu')) os = 'Ubuntu';
  else if (ua.includes('fedora')) os = 'Fedora';
  else if (ua.includes('cros')) os = 'Chrome OS';
  
  // Detect browser
  let browser = 'Unknown';
  let browserVersion = '';
  
  if (ua.includes('edg/')) {
    browser = 'Edge';
    const match = ua.match(/edg\/([\d.]+)/);
    browserVersion = match ? match[1] : '';
  } else if (ua.includes('opr/') || ua.includes('opera/')) {
    browser = 'Opera';
    const match = ua.match(/(?:opr|opera)\/([\d.]+)/);
    browserVersion = match ? match[1] : '';
  } else if (ua.includes('chrome/')) {
    browser = 'Chrome';
    const match = ua.match(/chrome\/([\d.]+)/);
    browserVersion = match ? match[1] : '';
  } else if (ua.includes('safari/') && !ua.includes('chrome')) {
    browser = 'Safari';
    const match = ua.match(/version\/([\d.]+)/);
    browserVersion = match ? match[1] : '';
  } else if (ua.includes('firefox/')) {
    browser = 'Firefox';
    const match = ua.match(/firefox\/([\d.]+)/);
    browserVersion = match ? match[1] : '';
  } else if (ua.includes('msie') || ua.includes('trident/')) {
    browser = 'Internet Explorer';
    const match = ua.match(/(?:msie |rv:)([\d.]+)/);
    browserVersion = match ? match[1] : '';
  }
  
  return {
    type,
    os,
    browser,
    browserVersion
  };
}
