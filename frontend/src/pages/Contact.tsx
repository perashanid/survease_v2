import React, { useState } from 'react';
import { apiClient as api } from '../services/api';
import { motion } from 'framer-motion';
import { 
  FiMail, FiSend, FiCheckCircle, FiAlertCircle,
  FiMessageSquare, FiBriefcase, FiClock, FiGlobe
} from 'react-icons/fi';
import { FaTwitter, FaLinkedin, FaGithub, FaDiscord } from 'react-icons/fa';
import './Contact.css';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const Contact: React.FC = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/contact', formData);
      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="contact-page">
        <div className="container">
          <motion.div 
            className="contact-success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="success-icon"><FiCheckCircle /></div>
            <h1>Message Sent!</h1>
            <p>Thank you for contacting us. We'll get back to you as soon as possible.</p>
            <button 
              className="btn btn-primary"
              onClick={() => setSuccess(false)}
            >
              <FiSend /> Send Another Message
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="contact-page">
      <div className="container">
        <motion.div 
          className="contact-header"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <h1>Contact Us</h1>
          <p>Have a question, suggestion, or need help? We'd love to hear from you!</p>
        </motion.div>

        <div className="contact-content">
          <div className="contact-info">
            <div className="info-section">
              <h3><FiMail /> Email Support</h3>
              <p>For general inquiries and support:</p>
              <a href="mailto:support@surveyplatform.com" className="contact-link">
                support@surveyplatform.com
              </a>
            </div>

            <div className="info-section">
              <h3><FiMessageSquare /> Feature Requests</h3>
              <p>Have an idea for a new feature?</p>
              <a href="mailto:features@surveyplatform.com" className="contact-link">
                features@surveyplatform.com
              </a>
            </div>

            <div className="info-section">
              <h3><FiAlertCircle /> Bug Reports</h3>
              <p>Found a bug? Let us know:</p>
              <a href="mailto:bugs@surveyplatform.com" className="contact-link">
                bugs@surveyplatform.com
              </a>
            </div>

            <div className="info-section">
              <h3><FiBriefcase /> Business Inquiries</h3>
              <p>For partnerships and business matters:</p>
              <a href="mailto:business@surveyplatform.com" className="contact-link">
                business@surveyplatform.com
              </a>
            </div>

            <div className="info-section">
              <h3><FiClock /> Response Time</h3>
              <p>We typically respond within 24 hours during business days.</p>
            </div>

            <div className="info-section">
              <h3><FiGlobe /> Connect With Us</h3>
              <p>Follow us on social media for updates and tips:</p>
              <div className="social-links">
                <a 
                  href="https://twitter.com/surveyplatform" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="social-link twitter"
                  aria-label="Follow us on Twitter"
                  title="Twitter"
                >
                  <FaTwitter />
                </a>
                <a 
                  href="https://linkedin.com/company/surveyplatform" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="social-link linkedin"
                  aria-label="Connect with us on LinkedIn"
                  title="LinkedIn"
                >
                  <FaLinkedin />
                </a>
                <a 
                  href="https://github.com/surveyplatform" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="social-link github"
                  aria-label="View our code on GitHub"
                  title="GitHub"
                >
                  <FaGithub />
                </a>
                <a 
                  href="https://discord.gg/surveyplatform" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="social-link discord"
                  aria-label="Join our Discord community"
                  title="Discord"
                >
                  <FaDiscord />
                </a>
              </div>
            </div>
          </div>

          <div className="contact-form-container">
            <form onSubmit={handleSubmit} className="contact-form">
              <h3>Send us a message</h3>
              
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Your full name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email <span className="required">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="subject" className="form-label">
                  Subject
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="">Select a subject</option>
                  <option value="general">General Inquiry</option>
                  <option value="support">Technical Support</option>
                  <option value="feature">Feature Request</option>
                  <option value="bug">Bug Report</option>
                  <option value="business">Business Inquiry</option>
                  <option value="feedback">Feedback</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="message" className="form-label">
                  Message <span className="required">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  className="form-textarea"
                  placeholder="Please describe your inquiry in detail..."
                  rows={6}
                  required
                />
              </div>

              {error && (
                <motion.div 
                  className="error-message"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <FiAlertCircle /> {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary submit-btn"
              >
                {loading ? (
                  <>
                    <span className="spinner-small"></span>
                    Sending...
                  </>
                ) : (
                  <>
                    <FiSend /> Send Message
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="contact-footer">
          <div className="faq-section">
            <h3>Frequently Asked Questions</h3>
            <div className="faq-grid">
              <motion.div 
                className="faq-item"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <h4>How do I create a survey?</h4>
                <p>Simply sign up for an account and click "Create Survey" from your dashboard. Our intuitive builder makes it easy!</p>
              </motion.div>
              <motion.div 
                className="faq-item"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <h4>Can I make my surveys public?</h4>
                <p>Yes! You can choose to make your surveys public so anyone can participate and view the results.</p>
              </motion.div>
              <motion.div 
                className="faq-item"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <h4>How do I export survey data?</h4>
                <p>Go to your survey analytics page and use the export buttons to download your data in JSON or CSV format.</p>
              </motion.div>
              <motion.div 
                className="faq-item"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <h4>Is there a limit on responses?</h4>
                <p>No, there's no limit on the number of responses you can collect for your surveys.</p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
