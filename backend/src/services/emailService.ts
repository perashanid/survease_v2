import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@surveyplatform.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  private static getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      if (!SMTP_USER || !SMTP_PASSWORD) {
        console.warn('Email service not configured. SMTP credentials missing.');
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: 'test@ethereal.email',
            pass: 'test'
          }
        });
      } else {
        this.transporter = nodemailer.createTransport({
          host: SMTP_HOST,
          port: SMTP_PORT,
          secure: SMTP_SECURE,
          auth: {
            user: SMTP_USER,
            pass: SMTP_PASSWORD
          }
        });
      }
    }
    return this.transporter;
  }

  static async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    userName?: string
  ): Promise<void> {
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
      const info = await transporter.sendMail(mailOptions);
      console.log('Password reset email sent:', info.messageId);
      
      if (info.messageId && !SMTP_USER) {
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      }
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  static async sendPasswordResetConfirmation(
    email: string,
    userName?: string
  ): Promise<void> {
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
      console.log('Password reset confirmation email sent:', info.messageId);
    } catch (error) {
      console.error('Error sending password reset confirmation email:', error);
    }
  }
}
