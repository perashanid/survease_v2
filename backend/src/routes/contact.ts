import express, { Request, Response } from 'express';
import Joi from 'joi';
import nodemailer from 'nodemailer';

const router = express.Router();

// Validation schema for contact form
const contactSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().required(),
  subject: Joi.string().trim().max(200).optional().allow(''),
  message: Joi.string().trim().min(10).max(2000).required()
});

// Configure email transporter (you'll need to set up your email service)
const createEmailTransporter = () => {
  // For development, you can use a service like Ethereal Email for testing
  // In production, use your actual email service (Gmail, SendGrid, etc.)
  
  if (process.env.NODE_ENV === 'production') {
    // Production email configuration
    return nodemailer.createTransport({
      service: 'gmail', // or your email service
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } else {
    // Development/test configuration - logs to console
    return nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true
    });
  }
};

/**
 * POST /api/contact
 * Submit contact form
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = contactSchema.validate(req.body);
    
    if (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid contact form data',
          details: error.details[0].message
        }
      });
      return;
    }

    const { name, email, subject, message } = value;
    
    // Create email transporter
    const transporter = createEmailTransporter();
    
    // Email content
    const emailSubject = subject ? `Contact Form: ${subject}` : 'Contact Form Submission';
    const emailContent = `
      New contact form submission:
      
      Name: ${name}
      Email: ${email}
      Subject: ${subject || 'No subject'}
      
      Message:
      ${message}
      
      ---
      Sent from Survey Platform Contact Form
      Time: ${new Date().toISOString()}
    `;

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@surveyplatform.com',
      to: process.env.CONTACT_EMAIL || 'support@surveyplatform.com',
      subject: emailSubject,
      text: emailContent,
      replyTo: email
    };

    if (process.env.NODE_ENV === 'production') {
      await (transporter as any).sendMail(mailOptions);
    } else {
      // In development, just log the email content
      console.log('Contact form submission (development mode):');
      console.log('From:', email);
      console.log('Subject:', emailSubject);
      console.log('Message:', emailContent);
    }

    // Send auto-reply to user (optional)
    if (process.env.SEND_AUTO_REPLY === 'true') {
      const autoReplyOptions = {
        from: process.env.EMAIL_FROM || 'noreply@surveyplatform.com',
        to: email,
        subject: 'Thank you for contacting us',
        text: `
          Hi ${name},
          
          Thank you for contacting us! We've received your message and will get back to you as soon as possible.
          
          Your message:
          "${message}"
          
          Best regards,
          The Survey Platform Team
        `
      };

      if (process.env.NODE_ENV === 'production') {
        await (transporter as any).sendMail(autoReplyOptions);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Contact form submitted successfully'
    });

  } catch (error: any) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to submit contact form'
      }
    });
  }
});

export default router;