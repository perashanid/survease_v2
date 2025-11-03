import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FiTwitter, 
  FiLinkedin, 
  FiGithub, 
  FiMail, 
  FiHeart 
} from 'react-icons/fi';
import './Footer.css';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-title">SurvEase</h3>
            <p className="footer-description">
              Create, share, and analyze surveys with ease. 
              Build better insights with our powerful survey tools.
            </p>
            <div className="footer-social">
              <a href="https://twitter.com/surveyplatform" className="social-link" aria-label="Twitter" target="_blank" rel="noopener noreferrer">
                <FiTwitter />
              </a>
              <a href="https://linkedin.com/company/surveyplatform" className="social-link" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
                <FiLinkedin />
              </a>
              <a href="https://github.com/surveyplatform" className="social-link" aria-label="GitHub" target="_blank" rel="noopener noreferrer">
                <FiGithub />
              </a>
              <a href="mailto:support@surveyplatform.com" className="social-link" aria-label="Email" target="_blank" rel="noopener noreferrer">
                <FiMail />
              </a>
            </div>
          </div>

          <div className="footer-section">
            <h4 className="footer-section-title">Platform</h4>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/surveys">Public Surveys</Link></li>
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li><Link to="/create">Create Survey</Link></li>
              <li><Link to="/analytics">Analytics</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-section-title">Resources</h4>
            <ul className="footer-links">
              <li><Link to="/documentation">Documentation</Link></li>
              <li><Link to="/api-reference">API Reference</Link></li>
              <li><Link to="/tutorials">Tutorials</Link></li>
              <li><Link to="/best-practices">Best Practices</Link></li>
              <li><Link to="/community">Community</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-section-title">Support</h4>
            <ul className="footer-links">
              <li><Link to="/contact">Contact Us</Link></li>
              <li><Link to="/help-center">Help Center</Link></li>
              <li><Link to="/status">Status Page</Link></li>
              <li><Link to="/report-bug">Report Bug</Link></li>
              <li><Link to="/feature-request">Feature Request</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-section-title">Legal</h4>
            <ul className="footer-links">
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
              <li><Link to="/cookies">Cookie Policy</Link></li>
              <li><Link to="/gdpr">GDPR</Link></li>
              <li><Link to="/accessibility">Accessibility</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="footer-copyright">
              © {currentYear} SurvEase. Made with <FiHeart className="heart-icon" /> for better insights.
            </p>
            <div className="footer-bottom-links">
              <Link to="/privacy">Privacy</Link>
              <span className="separator">•</span>
              <Link to="/terms">Terms</Link>
              <span className="separator">•</span>
              <Link to="/contact">Contact</Link>
              <span className="separator">•</span>
              <Link to="/help-center">Support</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
