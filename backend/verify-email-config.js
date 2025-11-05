/**
 * Email Configuration Verification Script
 * Run this script to verify your email service is properly configured
 * 
 * Usage: node verify-email-config.js
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@surveyplatform.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

console.log('\n🔍 Email Configuration Verification\n');
console.log('=' .repeat(60));

// Check environment variables
console.log('\n📋 Environment Variables:');
console.log('  SMTP_HOST:', SMTP_HOST || '❌ NOT SET');
console.log('  SMTP_PORT:', SMTP_PORT || '❌ NOT SET');
console.log('  SMTP_SECURE:', SMTP_SECURE);
console.log('  SMTP_USER:', SMTP_USER ? '✅ SET' : '❌ NOT SET');
console.log('  SMTP_PASSWORD:', SMTP_PASSWORD ? '✅ SET' : '❌ NOT SET');
console.log('  EMAIL_FROM:', EMAIL_FROM || '❌ NOT SET');
console.log('  FRONTEND_URL:', FRONTEND_URL || '❌ NOT SET');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'not set');

// Check if required variables are set
const missingVars = [];
if (!SMTP_USER) missingVars.push('SMTP_USER');
if (!SMTP_PASSWORD) missingVars.push('SMTP_PASSWORD');

if (missingVars.length > 0) {
  console.log('\n❌ CRITICAL: Missing required environment variables:');
  missingVars.forEach(v => console.log(`   - ${v}`));
  console.log('\n💡 Please set these variables in your .env file or deployment environment.');
  process.exit(1);
}

console.log('\n✅ All required environment variables are set!');

// Create transporter
console.log('\n🔧 Creating email transporter...');
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASSWORD
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
  debug: true,
  logger: true
});

// Verify connection
console.log('\n🔌 Testing SMTP connection...');
transporter.verify((error, success) => {
  if (error) {
    console.log('\n❌ SMTP Connection FAILED!');
    console.log('Error:', error.message);
    console.log('\nPossible issues:');
    console.log('  1. Incorrect SMTP credentials');
    console.log('  2. SMTP server is down or unreachable');
    console.log('  3. Firewall blocking outbound connections on port', SMTP_PORT);
    console.log('  4. Network connectivity issues');
    console.log('\n💡 For Brevo (Sendinblue):');
    console.log('  - Check your SMTP credentials at: https://app.brevo.com/settings/keys/smtp');
    console.log('  - Ensure your account is active and verified');
    console.log('  - Verify sender email is authorized');
    process.exit(1);
  } else {
    console.log('\n✅ SMTP Connection Successful!');
    console.log('   Server is ready to send emails.');
    
    // Send test email
    console.log('\n📧 Sending test email...');
    const testEmail = {
      from: EMAIL_FROM,
      to: SMTP_USER, // Send to yourself for testing
      subject: 'Test Email - SurvEase Email Service',
      html: `
        <h2>✅ Email Service Test Successful!</h2>
        <p>This is a test email from your SurvEase application.</p>
        <p><strong>Configuration Details:</strong></p>
        <ul>
          <li>SMTP Host: ${SMTP_HOST}</li>
          <li>SMTP Port: ${SMTP_PORT}</li>
          <li>From: ${EMAIL_FROM}</li>
          <li>Frontend URL: ${FRONTEND_URL}</li>
        </ul>
        <p>If you received this email, your email service is working correctly!</p>
        <p><em>Sent at: ${new Date().toISOString()}</em></p>
      `,
      text: `
Email Service Test Successful!

This is a test email from your SurvEase application.

Configuration Details:
- SMTP Host: ${SMTP_HOST}
- SMTP Port: ${SMTP_PORT}
- From: ${EMAIL_FROM}
- Frontend URL: ${FRONTEND_URL}

If you received this email, your email service is working correctly!

Sent at: ${new Date().toISOString()}
      `
    };

    transporter.sendMail(testEmail, (error, info) => {
      if (error) {
        console.log('\n❌ Test Email FAILED!');
        console.log('Error:', error.message);
        console.log('\nDetails:', error);
        process.exit(1);
      } else {
        console.log('\n✅ Test Email Sent Successfully!');
        console.log('   Message ID:', info.messageId);
        console.log('   Response:', info.response);
        console.log('   Accepted:', info.accepted);
        console.log('   Rejected:', info.rejected);
        console.log('\n📬 Check your inbox at:', SMTP_USER);
        console.log('\n🎉 Email service is fully configured and working!');
        console.log('=' .repeat(60));
        process.exit(0);
      }
    });
  }
});
