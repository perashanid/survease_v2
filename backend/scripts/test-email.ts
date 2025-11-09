import dotenv from 'dotenv';
import { EmailService } from '../src/services/emailService';

// Load environment variables
dotenv.config();

async function testEmail() {
  console.log('Testing email service...\n');

  const testEmail = process.argv[2] || 'test@example.com';
  const testToken = 'test-reset-token-123456789';

  console.log(`Sending test password reset email to: ${testEmail}`);
  console.log('Note: If SMTP is not configured, check console for Ethereal preview URL\n');

  try {
    await EmailService.sendPasswordResetEmail(testEmail, testToken, 'Test User');
    console.log('\n✓ Password reset email sent successfully!');

    console.log('\nSending test confirmation email...');
    await EmailService.sendPasswordResetConfirmation(testEmail, 'Test User');
    console.log('✓ Confirmation email sent successfully!');

    console.log('\n✓ All email tests passed!');
  } catch (error) {
    console.error('\n✗ Email test failed:', error);
    process.exit(1);
  }
}

testEmail();
