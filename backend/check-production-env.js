/**
 * Production Environment Variables Checker
 * Run this to verify all required variables are set before deployment
 * 
 * Usage: node check-production-env.js
 */

const requiredVars = {
  // Critical Email Variables
  'SMTP_HOST': 'SMTP server hostname (e.g., smtp-relay.brevo.com)',
  'SMTP_PORT': 'SMTP server port (e.g., 587)',
  'SMTP_USER': 'SMTP username/login',
  'SMTP_PASSWORD': 'SMTP password',
  'EMAIL_FROM': 'Sender email address',
  
  // Application URLs
  'FRONTEND_URL': 'Frontend application URL',
  'BACKEND_URL': 'Backend API URL',
  
  // Database
  'MONGODB_URI': 'MongoDB connection string',
  
  // Security
  'JWT_SECRET': 'JWT signing secret',
  'JWT_REFRESH_SECRET': 'JWT refresh token secret',
  'SESSION_SECRET': 'Session secret',
  'COOKIE_SECRET': 'Cookie secret',
  
  // CORS
  'CORS_ORIGIN': 'Allowed CORS origins'
};

const recommendedVars = {
  'NODE_ENV': 'Environment (production/development)',
  'PORT': 'Server port',
  'GEMINI_API_KEY': 'Google Gemini API key (for AI features)',
  'ENABLE_AI_FEATURES': 'Enable/disable AI features',
  'LOG_LEVEL': 'Logging level',
  'RATE_LIMIT_MAX_REQUESTS': 'Rate limit max requests',
  'RATE_LIMIT_WINDOW_MS': 'Rate limit window in milliseconds'
};

console.log('\n🔍 Production Environment Variables Check\n');
console.log('=' .repeat(70));

// Check required variables
console.log('\n📋 REQUIRED Variables:\n');
let missingRequired = [];
let setRequired = [];

Object.entries(requiredVars).forEach(([key, description]) => {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    console.log(`❌ ${key.padEnd(25)} - MISSING`);
    console.log(`   ${description}`);
    missingRequired.push(key);
  } else {
    // Mask sensitive values
    let displayValue = value;
    if (key.includes('SECRET') || key.includes('PASSWORD') || key.includes('KEY')) {
      displayValue = value.substring(0, 10) + '...' + value.substring(value.length - 5);
    } else if (value.length > 50) {
      displayValue = value.substring(0, 47) + '...';
    }
    console.log(`✅ ${key.padEnd(25)} - ${displayValue}`);
    setRequired.push(key);
  }
});

// Check recommended variables
console.log('\n📋 RECOMMENDED Variables:\n');
let missingRecommended = [];
let setRecommended = [];

Object.entries(recommendedVars).forEach(([key, description]) => {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    console.log(`⚠️  ${key.padEnd(25)} - NOT SET`);
    console.log(`   ${description}`);
    missingRecommended.push(key);
  } else {
    let displayValue = value;
    if (key.includes('SECRET') || key.includes('PASSWORD') || key.includes('KEY')) {
      displayValue = value.substring(0, 10) + '...' + value.substring(value.length - 5);
    } else if (value.length > 50) {
      displayValue = value.substring(0, 47) + '...';
    }
    console.log(`✅ ${key.padEnd(25)} - ${displayValue}`);
    setRecommended.push(key);
  }
});

// Summary
console.log('\n' + '=' .repeat(70));
console.log('\n📊 SUMMARY:\n');
console.log(`Required Variables:     ${setRequired.length}/${Object.keys(requiredVars).length} set`);
console.log(`Recommended Variables:  ${setRecommended.length}/${Object.keys(recommendedVars).length} set`);

if (missingRequired.length > 0) {
  console.log('\n❌ CRITICAL: Missing required variables:');
  missingRequired.forEach(v => console.log(`   - ${v}`));
  console.log('\n⚠️  Your application will NOT work properly without these!');
  console.log('   Please set them in your deployment platform or .env file.');
  process.exit(1);
} else {
  console.log('\n✅ All required variables are set!');
}

if (missingRecommended.length > 0) {
  console.log('\n⚠️  Missing recommended variables:');
  missingRecommended.forEach(v => console.log(`   - ${v}`));
  console.log('\n💡 These are optional but recommended for production.');
}

// Security checks
console.log('\n🔐 SECURITY CHECKS:\n');

const securityIssues = [];

// Check if secrets are strong enough
const secrets = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'SESSION_SECRET', 'COOKIE_SECRET'];
secrets.forEach(key => {
  const value = process.env[key];
  if (value) {
    if (value.length < 32) {
      securityIssues.push(`${key} is too short (${value.length} chars, minimum 32 recommended)`);
    }
    if (value.toLowerCase().includes('change') || value.toLowerCase().includes('example')) {
      securityIssues.push(`${key} appears to be a placeholder value`);
    }
  }
});

// Check NODE_ENV
if (process.env.NODE_ENV !== 'production') {
  securityIssues.push(`NODE_ENV is not set to 'production' (current: ${process.env.NODE_ENV || 'not set'})`);
}

// Check CORS
if (process.env.CORS_ORIGIN && process.env.CORS_ORIGIN.includes('localhost')) {
  securityIssues.push('CORS_ORIGIN includes localhost (should be production domain)');
}

// Check URLs
if (process.env.FRONTEND_URL && process.env.FRONTEND_URL.includes('localhost')) {
  securityIssues.push('FRONTEND_URL includes localhost (should be production domain)');
}

if (securityIssues.length > 0) {
  console.log('⚠️  Security concerns found:');
  securityIssues.forEach(issue => console.log(`   - ${issue}`));
  console.log('\n💡 Please review and fix these before deploying to production.');
} else {
  console.log('✅ No security issues detected!');
}

// Email-specific checks
console.log('\n📧 EMAIL CONFIGURATION:\n');

const emailVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'EMAIL_FROM'];
const emailSet = emailVars.filter(v => process.env[v]);

if (emailSet.length === emailVars.length) {
  console.log('✅ All email variables are set');
  console.log('   Run "npm run test:email" to verify email is working');
} else {
  console.log('❌ Email configuration incomplete');
  console.log('   Missing:', emailVars.filter(v => !process.env[v]).join(', '));
}

// Final verdict
console.log('\n' + '=' .repeat(70));

if (missingRequired.length === 0 && securityIssues.length === 0) {
  console.log('\n🎉 Configuration looks good! Ready for deployment.\n');
  console.log('Next steps:');
  console.log('  1. Run "npm run test:email" to verify email');
  console.log('  2. Deploy to your platform');
  console.log('  3. Check production logs');
  console.log('  4. Test the application\n');
  process.exit(0);
} else {
  console.log('\n⚠️  Please fix the issues above before deploying.\n');
  process.exit(1);
}
