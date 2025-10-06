import React from 'react';
import { Link } from 'react-router-dom';
import { FaTwitter, FaLinkedin, FaGithub } from 'react-icons/fa';
import './Footer.css';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-title">Survey Platform</h3>
            <p className="footer-description">
              Create, share, and analyze surveys with ease. 
              Build better insights with our powerful survey tools.
            </p>
            <div className="footer-social">
              <a href="https://twitter.com/surveyplatform" className="social-link" aria-label="Twitter" target="_blank" rel="noopener noreferrer">
                <FaTwitter />
              </a>
              <a href="https://linkedin.com/company/surveyplatform" className="social-link" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
                <FaLinkedin />
              </a>
              <a href="https://github.com/surveyplatform" className="social-link" aria-label="GitHub" target="_blank" rel="noopener noreferrer">
                <FaGithub />
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
              <li><a href="#">Documentation</a></li>
              <li><a href="#">API Reference</a></li>
              <li><a href="#">Tutorials</a></li>
              <li><a href="#">Best Practices</a></li>
              <li><a href="#">Community</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-section-title">Support</h4>
            <ul className="footer-links">
              <li><Link to="/contact">Contact Us</Link></li>
              <li><a href="mailto:support@surveyplatform.com">Help Center</a></li>
              <li><a href="#">Status Page</a></li>
              <li><a href="#">Report Bug</a></li>
              <li><a href="#">Feature Request</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-section-title">Legal</h4>
            <ul className="footer-links">
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Cookie Policy</a></li>
              <li><a href="#">GDPR</a></li>
              <li><a href="#">Accessibility</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="footer-copyright">
              © {currentYear} Survey Platform. All rights reserved.
            </p>
            <div className="footer-bottom-links">
              <Link to="/privacy">Privacy</Link>
              <span className="separator">•</span>
              <a href="#">Terms</a>
              <span className="separator">•</span>
              <Link to="/contact">Contact</Link>
              <span className="separator">•</span>
              <a href="mailto:support@surveyplatform.com">Support</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
