import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@surveyplatform.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Brevo API configuration (fallback when SMTP is blocked)
const BREVO_API_KEY = process.env.BREVO_API_KEY || process.env.SMTP_PASSWORD;
const USE_BREVO_API = process.env.USE_BREVO_API === 'true' || !SMTP_USER;

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  /**
   * Send email via Brevo API (more reliable on cloud platforms where SMTP ports are blocked)
   */
  private static async sendViaBrevoAPI(
    email: string,
    resetToken: string,
    userName?: string
  ): Promise<void> {
    console.log('🔗 FRONTEND_URL from env:', process.env.FRONTEND_URL);
    console.log('🔗 FRONTEND_URL constant:', FRONTEND_URL);
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;
    console.log('🔗 Generated reset URL:', resetUrl);
    const displayName = userName || email;

    const emailData = {
      sender: {
        name: 'SurvEase',
        email: EMAIL_FROM.includes('<') ? EMAIL_FROM.match(/<(.+)>/)?.[1] : EMAIL_FROM
      },
      to: [{ email, name: displayName }],
      subject: 'Password Reset Request - Survey Platform',
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 8px 32px rgba(74, 222, 128, 0.15); overflow: hidden;">
                  <!-- Header with Logo -->
                  <tr>
                    <td style="padding: 48px 40px 32px 40px; text-align: center; background: linear-gradient(135deg, #bbf7d0 0%, #4ade80 50%, #14b8a6 100%);">
                      <div style="background: rgba(255, 255, 255, 0.95); width: 64px; height: 64px; border-radius: 16px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);">
                        <span style="font-size: 32px; font-weight: 900; background: linear-gradient(135deg, #4ade80 0%, #14b8a6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">S</span>
                      </div>
                      <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 800; text-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">SurvEase</h1>
                      <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.95); font-size: 16px; font-weight: 500;">Password Reset Request</p>
                    </td>
                  </tr>
                  <!-- Content -->
                  <tr>
                    <td style="padding: 48px 40px;">
                      <p style="margin: 0 0 24px 0; color: #0f172a; font-size: 18px; font-weight: 600;">Hi ${displayName},</p>
                      <p style="margin: 0 0 24px 0; color: #334155; font-size: 16px; line-height: 1.6;">We received a request to reset your password for your SurvEase account. Click the button below to create a new password:</p>
                      
                      <!-- Reset Button -->
                      <table role="presentation" style="margin: 32px 0; width: 100%;">
                        <tr>
                          <td align="center">
                            <a href="${resetUrl}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #4ade80 0%, #14b8a6 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 16px; font-weight: 700; box-shadow: 0 8px 24px rgba(74, 222, 128, 0.3); transition: all 0.3s;">Reset Password →</a>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Alternative Link -->
                      <div style="margin: 32px 0; padding: 20px; background: #f8fafc; border-radius: 12px; border-left: 4px solid #4ade80;">
                        <p style="margin: 0 0 12px 0; color: #64748b; font-size: 14px; font-weight: 600;">Or copy and paste this link:</p>
                        <p style="margin: 0; color: #14b8a6; font-size: 14px; word-break: break-all; font-family: 'Courier New', monospace;">${resetUrl}</p>
                      </div>
                      
                      <!-- Security Info -->
                      <div style="margin: 32px 0; padding: 20px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px;">
                        <p style="margin: 0 0 8px 0; color: #92400e; font-size: 14px; font-weight: 600;">⏱️ Security Notice</p>
                        <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.5;">This link will expire in <strong>1 hour</strong> for your security.</p>
                      </div>
                      
                      <p style="margin: 24px 0 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 32px 40px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-top: 1px solid #e2e8f0;">
                      <table role="presentation" style="width: 100%;">
                        <tr>
                          <td align="center">
                            <p style="margin: 0 0 12px 0; color: #4ade80; font-size: 20px; font-weight: 800;">SurvEase</p>
                            <p style="margin: 0 0 16px 0; color: #64748b; font-size: 13px; line-height: 1.6;">Create, Share, and Analyze Surveys with Ease</p>
                            <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                              © ${new Date().getFullYear()} SurvEase. All rights reserved.
                            </p>
                            <p style="margin: 8px 0 0 0; color: #cbd5e1; font-size: 11px;">
                              This is an automated email. Please do not reply.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    };

    try {
      console.log('📧 Sending via Brevo API to:', email);
      
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': BREVO_API_KEY!,
          'content-type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        const errorData: any = await response.json();
        console.error('❌ Brevo API error:', errorData);
        throw new Error(`Brevo API error: ${errorData.message || response.statusText}`);
      }

      const result: any = await response.json();
      console.log('✅ Email sent via Brevo API successfully!');
      console.log('📧 Message ID:', result.messageId);
    } catch (error: any) {
      console.error('❌ Failed to send via Brevo API:', error);
      throw new Error(`Failed to send email via Brevo API: ${error.message}`);
    }
  }

  private static getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      if (!SMTP_USER || !SMTP_PASSWORD) {
        console.error('❌ CRITICAL: Email service not configured. SMTP credentials missing.');
        console.error('Environment check:', {
          SMTP_HOST: SMTP_HOST || 'NOT SET',
          SMTP_PORT: SMTP_PORT || 'NOT SET',
          SMTP_USER: SMTP_USER ? 'SET' : 'NOT SET',
          SMTP_PASSWORD: SMTP_PASSWORD ? 'SET' : 'NOT SET',
          EMAIL_FROM: EMAIL_FROM || 'NOT SET',
          NODE_ENV: process.env.NODE_ENV
        });
        throw new Error('Email service not configured. Please set SMTP_USER and SMTP_PASSWORD environment variables.');
      }

      console.log('✅ Initializing email transporter with:', {
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_SECURE,
        user: SMTP_USER.substring(0, 10) + '...',
        from: EMAIL_FROM
      });

      this.transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_SECURE,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASSWORD
        },
        // Add connection timeout and retry settings
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
        // Enable debug logging in development
        debug: process.env.NODE_ENV === 'development',
        logger: process.env.NODE_ENV === 'development'
      });

      // Verify connection on initialization
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('❌ SMTP connection verification failed:', error);
        } else {
          console.log('✅ SMTP server is ready to send emails');
        }
      });
    }
    return this.transporter;
  }

  static async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    userName?: string
  ): Promise<void> {
    console.log('='.repeat(80));
    console.log('📧 EMAIL SERVICE: sendPasswordResetEmail called');
    console.log('📧 Recipient:', email);
    console.log('📧 Using Brevo API:', !!BREVO_API_KEY);
    console.log('📧 Environment check:', {
      SMTP_HOST,
      SMTP_PORT,
      SMTP_SECURE,
      SMTP_USER: SMTP_USER ? 'SET' : 'NOT SET',
      SMTP_PASSWORD: SMTP_PASSWORD ? 'SET' : 'NOT SET',
      BREVO_API_KEY: BREVO_API_KEY ? 'SET' : 'NOT SET',
      EMAIL_FROM,
      FRONTEND_URL
    });
    console.log('='.repeat(80));

    // If Brevo API key is available, use API instead of SMTP (more reliable on cloud platforms)
    if (BREVO_API_KEY) {
      console.log('📧 Using Brevo API (HTTPS) instead of SMTP');
      return this.sendViaBrevoAPI(email, resetToken, userName);
    }

    // Check if email service is properly configured
    if (!SMTP_USER || !SMTP_PASSWORD) {
      const errorMsg = 'Email service not configured - SMTP credentials missing';
      console.error('❌', errorMsg);
      console.error('Password reset token for', email, ':', resetToken);
      console.error('Reset URL:', `${FRONTEND_URL}/reset-password?token=${resetToken}`);
      throw new Error(errorMsg);
    }

    const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;
    const displayName = userName || email;

    const mailOptions = {
      from: EMAIL_FROM,
      to: email,
      subject: 'Password Reset Request - Survey Platform',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Password Reset</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                        Hi ${displayName},
                      </p>
                      <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                        We received a request to reset your password for your Survey Platform account. Click the button below to create a new password:
                      </p>
                      
                      <!-- Button -->
                      <table role="presentation" style="margin: 30px 0; width: 100%;">
                        <tr>
                          <td align="center">
                            <a href="${resetUrl}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">Reset Password</a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 20px 0; color: #666666; font-size: 14px; line-height: 1.6;">
                        Or copy and paste this link into your browser:
                      </p>
                      <p style="margin: 0 0 20px 0; color: #667eea; font-size: 14px; word-break: break-all;">
                        ${resetUrl}
                      </p>
                      
                      <p style="margin: 20px 0; color: #666666; font-size: 14px; line-height: 1.6;">
                        This link will expire in <strong>1 hour</strong> for security reasons.
                      </p>
                      
                      <p style="margin: 20px 0; color: #666666; font-size: 14px; line-height: 1.6;">
                        If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
                      <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.6; text-align: center;">
                        This is an automated email from Survey Platform. Please do not reply to this email.
                      </p>
                      <p style="margin: 10px 0 0 0; color: #999999; font-size: 12px; line-height: 1.6; text-align: center;">
                        © ${new Date().getFullYear()} Survey Platform. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `
Hi ${displayName},

We received a request to reset your password for your Survey Platform account.

To reset your password, click the link below or copy and paste it into your browser:
${resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

Best regards,
Survey Platform Team
      `
    };

    try {
      const transporter = this.getTransporter();
      console.log('📧 Sending password reset email to:', email);
      console.log('📧 SMTP configured:', !!(SMTP_USER && SMTP_PASSWORD));
      console.log('📧 SMTP details:', {
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_SECURE,
        user: SMTP_USER ? `${SMTP_USER.substring(0, 10)}...` : 'missing',
        from: EMAIL_FROM,
        resetUrl: `${FRONTEND_URL}/reset-password?token=${resetToken.substring(0, 20)}...`
      });
      
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Password reset email sent successfully!');
      console.log('📧 Message ID:', info.messageId);
      console.log('📧 Response:', info.response);
      console.log('📧 Accepted:', info.accepted);
      console.log('📧 Rejected:', info.rejected);
    } catch (error: any) {
      console.error('❌ CRITICAL ERROR sending password reset email:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode,
        stack: error.stack
      });
      console.error('❌ SMTP Config at time of error:', {
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_SECURE,
        user: SMTP_USER ? 'configured' : 'missing',
        password: SMTP_PASSWORD ? 'configured' : 'missing',
        from: EMAIL_FROM,
        frontendUrl: FRONTEND_URL
      });
      // Re-throw the error so the caller knows it failed
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  }

  static async sendPasswordResetConfirmation(
    email: string,
    userName?: string
  ): Promise<void> {
    // Check if email service is properly configured
    if (!SMTP_USER || !SMTP_PASSWORD) {
      console.error('❌ Email service not configured - skipping confirmation email');
      return;
    }

    const displayName = userName || email;

    const mailOptions = {
      from: EMAIL_FROM,
      to: email,
      subject: 'Password Reset Successful - Survey Platform',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset Successful</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px 8px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">✓ Password Reset Successful</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                        Hi ${displayName},
                      </p>
                      <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                        Your password has been successfully reset. You can now log in to your Survey Platform account with your new password.
                      </p>
                      
                      <!-- Button -->
                      <table role="presentation" style="margin: 30px 0; width: 100%;">
                        <tr>
                          <td align="center">
                            <a href="${FRONTEND_URL}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">Go to Login</a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 20px 0; color: #666666; font-size: 14px; line-height: 1.6;">
                        If you didn't make this change or believe an unauthorized person has accessed your account, please contact our support team immediately.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
                      <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.6; text-align: center;">
                        This is an automated email from Survey Platform. Please do not reply to this email.
                      </p>
                      <p style="margin: 10px 0 0 0; color: #999999; font-size: 12px; line-height: 1.6; text-align: center;">
                        © ${new Date().getFullYear()} Survey Platform. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `
Hi ${displayName},

Your password has been successfully reset. You can now log in to your Survey Platform account with your new password.

If you didn't make this change or believe an unauthorized person has accessed your account, please contact our support team immediately.

Best regards,
Survey Platform Team
      `
    };

    try {
      const transporter = this.getTransporter();
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Password reset confirmation email sent:', info.messageId);
    } catch (error: any) {
      console.error('❌ Error sending password reset confirmation email:', error.message);
      // Don't throw - just log the error
    }
  }
}
